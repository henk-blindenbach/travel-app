import { NextResponse } from "next/server";
import { createClient } from "../../../../../lib/supabase/server";
import { validUuid } from "../../../../../lib/journal";
import { openAiUserMessage, outputText } from "../../../../../lib/openai-text";
import {
  SOCIAL_CAPTION_CHUNKS,
  SOCIAL_PLATFORM_KEYS,
  normalizeSocialCaptions,
  sanitizeSocialCaptions,
  socialCaptionsJsonSchema,
  socialCaptionsPrompt,
  type SocialCaptions,
  type SocialPlatformKey,
} from "../../../../../lib/social-captions";

export const runtime = "nodejs";
/** Room for two OpenAI chunks on large photo days (Hobby/Pro serverless). */
export const maxDuration = 60;

const OPENAI_CHUNK_TIMEOUT_MS = 22_000;

function captionsComplete(captions: SocialCaptions, platforms: readonly SocialPlatformKey[] = SOCIAL_PLATFORM_KEYS) {
  return platforms.every((key) => Boolean(captions[key]?.trim()));
}

function pickCaptions(captions: SocialCaptions, platforms: readonly SocialPlatformKey[]) {
  const out: SocialCaptions = {};
  for (const key of platforms) {
    const value = captions[key]?.trim();
    if (value) out[key] = value;
  }
  return out;
}

function isTimeoutError(error: unknown) {
  return error instanceof DOMException && (error.name === "TimeoutError" || error.name === "AbortError");
}

async function generateCaptionChunk(input: {
  apiKey: string;
  title: string;
  location: string;
  body: string;
  photoCaptions: unknown;
  platforms: readonly SocialPlatformKey[];
}) {
  const prompt = socialCaptionsPrompt(
    {
      title: input.title,
      location: input.location,
      body: input.body,
      photoCaptions: input.photoCaptions,
    },
    input.platforms,
  );
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${input.apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-5-mini",
      reasoning: { effort: "minimal" },
      max_output_tokens: 1_000,
      input: prompt,
      text: {
        format: {
          type: "json_schema",
          name: "social_captions",
          strict: true,
          schema: socialCaptionsJsonSchema(input.platforms),
        },
      },
    }),
    signal: AbortSignal.timeout(OPENAI_CHUNK_TIMEOUT_MS),
  });
  if (!response.ok) {
    const error = new Error(openAiUserMessage(response.status));
    (error as Error & { status?: number }).status = response.status >= 500 ? 502 : response.status;
    throw error;
  }

  const result = (await response.json()) as { output_text?: unknown; output?: unknown };
  const raw = outputText(result);
  let captions: SocialCaptions;
  try {
    captions = sanitizeSocialCaptions(JSON.parse(raw || "{}"));
  } catch {
    const error = new Error("Captions konden niet worden gelezen. Probeer opnieuw.");
    (error as Error & { status?: number }).status = 502;
    throw error;
  }
  const picked = pickCaptions(captions, input.platforms);
  if (!captionsComplete(picked, input.platforms)) {
    const error = new Error("Captions konden niet worden gemaakt. Probeer opnieuw.");
    (error as Error & { status?: number }).status = 502;
    throw error;
  }
  return picked;
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
      .select("id,title,actual_location,body,social_captions,media_assets(caption,is_public,sort_order)")
      .eq("id", entryId)
      .single();
    if (error || !entry) return NextResponse.json({ error: "Verslag niet gevonden." }, { status: 404 });
    const key = process.env.OPENAI_API_KEY;
    if (!key) return NextResponse.json({ error: "OpenAI is nog niet ingesteld." }, { status: 503 });

    let merged = normalizeSocialCaptions(entry.social_captions);
    const failedPlatforms: SocialPlatformKey[] = [];
    let firstFailure: { message: string; status: number; timedOut: boolean } | null = null;

    for (const platforms of SOCIAL_CAPTION_CHUNKS) {
      if (captionsComplete(merged, platforms)) continue;
      try {
        const chunk = await generateCaptionChunk({
          apiKey: key,
          title: entry.title || "",
          location: entry.actual_location || "",
          body: entry.body || "",
          photoCaptions: entry.media_assets,
          platforms,
        });
        merged = sanitizeSocialCaptions({ ...merged, ...chunk });
        const { error: saveError } = await supabase
          .from("day_entries")
          .update({ social_captions: merged })
          .eq("id", entry.id);
        if (saveError) {
          return NextResponse.json({ error: "Captions konden niet worden opgeslagen." }, { status: 500 });
        }
      } catch (chunkError) {
        failedPlatforms.push(...platforms);
        const timedOut = isTimeoutError(chunkError);
        const status =
          timedOut
            ? 504
            : typeof chunkError === "object" &&
                chunkError &&
                "status" in chunkError &&
                typeof (chunkError as { status?: unknown }).status === "number"
              ? (chunkError as { status: number }).status
              : 500;
        const message =
          chunkError instanceof Error && chunkError.message
            ? chunkError.message
            : timedOut
              ? "Captions maken duurde te lang. Probeer opnieuw."
              : "Captions konden niet worden gemaakt. Probeer opnieuw.";
        if (!firstFailure) firstFailure = { message, status, timedOut };
        console.error("Social captions chunk failed", {
          platforms,
          timedOut,
          status,
        });
      }
    }

    if (captionsComplete(merged)) {
      return NextResponse.json({ captions: merged, partial: false });
    }

    if (hasAnySavedCaption(merged)) {
      return NextResponse.json({
        captions: merged,
        partial: true,
        missing: failedPlatforms,
        error:
          "Een deel van de captions is klaar. Tik opnieuw op «Maak captions» voor de ontbrekende platforms.",
      });
    }

    return NextResponse.json(
      {
        error: firstFailure?.timedOut
          ? "Captions maken duurde te lang. Probeer opnieuw."
          : firstFailure?.message || "Captions konden niet worden gemaakt. Probeer opnieuw.",
      },
      { status: firstFailure?.status || 500 },
    );
  } catch (error) {
    const timedOut = isTimeoutError(error);
    console.error("Social captions processing failed", { timedOut });
    return NextResponse.json(
      { error: timedOut ? "Captions maken duurde te lang. Probeer opnieuw." : "Captions konden niet worden gemaakt. Probeer opnieuw." },
      { status: timedOut ? 504 : 500 },
    );
  }
}

function hasAnySavedCaption(captions: SocialCaptions) {
  return SOCIAL_PLATFORM_KEYS.some((key) => Boolean(captions[key]?.trim()));
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
