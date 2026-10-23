import { NextResponse } from "next/server";
import {
  journalTranslateJsonSchema,
  journalTranslatePrompt,
  mergeTranslationPatch,
  normalizeEntryTranslations,
  parseAiTranslations,
} from "../../../../../lib/entry-i18n";
import { validUuid } from "../../../../../lib/journal";
import { openAiUserMessage, outputText } from "../../../../../lib/openai-text";
import { createClient } from "../../../../../lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 45;

export async function POST(_: Request, { params }: { params: Promise<{ entryId: string }> }) {
  try {
    const { entryId } = await params;
    if (!validUuid(entryId)) return NextResponse.json({ error: "Ongeldig verslag." }, { status: 400 });

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });

    const { data: entry, error } = await supabase
      .from("day_entries")
      .select("id,title,actual_location,body,title_i18n,body_i18n,actual_location_i18n")
      .eq("id", entryId)
      .single();
    if (error || !entry) return NextResponse.json({ error: "Verslag niet gevonden." }, { status: 404 });
    if (!String(entry.body || "").trim()) {
      return NextResponse.json({ error: "Schrijf eerst een Nederlands verslag vóór je vertaalt." }, { status: 400 });
    }

    const key = process.env.OPENAI_API_KEY;
    if (!key) return NextResponse.json({ error: "OpenAI is nog niet ingesteld." }, { status: 503 });

    const prompt = journalTranslatePrompt({
      title: entry.title || "",
      location: entry.actual_location || "",
      body: entry.body || "",
    });

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-5-mini",
        reasoning: { effort: "minimal" },
        max_output_tokens: 4_000,
        input: prompt,
        text: {
          format: {
            type: "json_schema",
            name: "journal_translations",
            strict: true,
            schema: journalTranslateJsonSchema(),
          },
        },
      }),
      signal: AbortSignal.timeout(40_000),
    });

    if (!response.ok) {
      console.error("OpenAI journal translate failed", { status: response.status });
      return NextResponse.json({ error: openAiUserMessage(response.status) }, { status: 502 });
    }

    const result = (await response.json()) as { output_text?: unknown; output?: unknown };
    const patch = parseAiTranslations(outputText(result));
    if (!patch) {
      return NextResponse.json({ error: "Vertalingen konden niet worden gelezen. Probeer opnieuw." }, { status: 502 });
    }

    const existing = normalizeEntryTranslations(entry);
    const merged = mergeTranslationPatch(existing, patch);
    // Keep Dutch mirrors aligned with primary columns.
    if (entry.title) merged.title_i18n.nl = entry.title;
    if (entry.body) merged.body_i18n.nl = entry.body;
    if (entry.actual_location) merged.actual_location_i18n.nl = entry.actual_location;

    const { data: saved, error: saveError } = await supabase
      .from("day_entries")
      .update({
        title_i18n: merged.title_i18n,
        body_i18n: merged.body_i18n,
        actual_location_i18n: merged.actual_location_i18n,
      })
      .eq("id", entry.id)
      .select("id,title,actual_location,body,title_i18n,body_i18n,actual_location_i18n,publication_status,updated_at")
      .single();

    if (saveError || !saved) {
      return NextResponse.json({ error: "Vertalingen konden niet worden opgeslagen." }, { status: 500 });
    }

    return NextResponse.json({ entry: saved, translations: merged });
  } catch (error) {
    const timedOut = error instanceof DOMException && error.name === "TimeoutError";
    console.error("Journal translate failed", { timedOut });
    return NextResponse.json(
      {
        error: timedOut
          ? "Vertalen duurde te lang. Probeer opnieuw."
          : "Vertalingen konden niet worden gemaakt. Probeer opnieuw.",
      },
      { status: timedOut ? 504 : 500 },
    );
  }
}
