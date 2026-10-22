import { NextResponse } from "next/server";
import { createClient } from "../../../../../lib/supabase/server";
import { validUuid } from "../../../../../lib/journal";
import { openAiUserMessage, outputText } from "../../../../../lib/openai-text";
import {
  SOCIAL_PLATFORM_KEYS,
  normalizeSocialCaptions,
  sanitizeSocialCaptions,
  socialCaptionsJsonSchema,
  socialCaptionsPrompt,
  type SocialCaptions,
} from "../../../../../lib/social-captions";

export const runtime = "nodejs";
export const maxDuration = 30;

function captionsComplete(captions: SocialCaptions) {
  return SOCIAL_PLATFORM_KEYS.every((key) => Boolean(captions[key]?.trim()));
}

export async function POST(_: Request, { params }: { params: Promise<{ entryId: string }> }) {
  try {
    const { entryId } = await params;
    if (!validUuid(entryId)) return NextResponse.json({ error: "Ongeldig verslag." }, { status: 400 });
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });
    const { data: entry, error } = await supabase
      .from("day_entries")
      .select("id,title,actual_location,body,media_assets(caption)")
      .eq("id", entryId)
      .single();
    if (error || !entry) return NextResponse.json({ error: "Verslag niet gevonden." }, { status: 404 });
    const key = process.env.OPENAI_API_KEY;
    if (!key) return NextResponse.json({ error: "OpenAI is nog niet ingesteld." }, { status: 503 });

    const prompt = socialCaptionsPrompt({
      title: entry.title,
      location: entry.actual_location,
      body: entry.body,
      photoCaptions: entry.media_assets,
    });
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-5-mini",
        reasoning: { effort: "minimal" },
        max_output_tokens: 1_400,
        input: prompt,
        text: {
          format: {
            type: "json_schema",
            name: "social_captions",
            strict: true,
            schema: socialCaptionsJsonSchema(),
          },
        },
      }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) {
      console.error("OpenAI social captions failed", { status: response.status });
      return NextResponse.json({ error: openAiUserMessage(response.status) }, { status: 502 });
    }

    const result = await response.json() as { output_text?: unknown; output?: unknown };
    const raw = outputText(result);
    let captions: SocialCaptions;
    try {
      captions = sanitizeSocialCaptions(JSON.parse(raw || "{}"));
    } catch {
      return NextResponse.json({ error: "Captions konden niet worden gelezen. Probeer opnieuw." }, { status: 502 });
    }
    if (!captionsComplete(captions)) {
      return NextResponse.json({ error: "Captions konden niet worden gemaakt. Probeer opnieuw." }, { status: 502 });
    }

    const { error: saveError } = await supabase.from("day_entries").update({ social_captions: captions }).eq("id", entry.id);
    if (saveError) return NextResponse.json({ error: "Captions konden niet worden opgeslagen." }, { status: 500 });
    return NextResponse.json({ captions });
  } catch (error) {
    const timedOut = error instanceof DOMException && error.name === "TimeoutError";
    console.error("Social captions processing failed", { timedOut });
    return NextResponse.json(
      { error: timedOut ? "Captions maken duurde te lang. Probeer opnieuw." : "Captions konden niet worden gemaakt. Probeer opnieuw." },
      { status: timedOut ? 504 : 500 },
    );
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ entryId: string }> }) {
  try {
    const { entryId } = await params;
    if (!validUuid(entryId)) return NextResponse.json({ error: "Ongeldig verslag." }, { status: 400 });
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });

    const { data: existing, error } = await supabase
      .from("day_entries")
      .select("id,social_captions")
      .eq("id", entryId)
      .single();
    if (error || !existing) return NextResponse.json({ error: "Verslag niet gevonden." }, { status: 404 });

    const payload = await request.json().catch(() => ({}));
    const incoming = sanitizeSocialCaptions(payload?.captions ?? payload);
    if (!Object.keys(incoming).length) {
      return NextResponse.json({ error: "Geen geldige captions." }, { status: 400 });
    }

    const merged = {
      ...normalizeSocialCaptions(existing.social_captions),
      ...incoming,
    };
    const captions = sanitizeSocialCaptions(merged);

    const { error: saveError } = await supabase
      .from("day_entries")
      .update({ social_captions: captions })
      .eq("id", entryId);
    if (saveError) return NextResponse.json({ error: "Captions konden niet worden opgeslagen." }, { status: 500 });
    return NextResponse.json({ captions });
  } catch {
    return NextResponse.json({ error: "Captions konden niet worden opgeslagen." }, { status: 500 });
  }
}
