import { NextResponse } from "next/server";
import { safeText, validUuid } from "../../../lib/journal";
import { createClient } from "../../../lib/supabase/server";

export const runtime = "nodejs";

type Message = { role: "assistant" | "user"; text: string };

class InterviewError extends Error {
  constructor(message: string, readonly category: string) { super(message); }
}

function openAiMessage(status: number) {
  if (status === 401 || status === 403) return "OpenAI accepteert de API-sleutel niet. Controleer OPENAI_API_KEY in Vercel.";
  if (status === 429) return "OpenAI heeft tijdelijk geen ruimte voor deze aanvraag. Controleer limiet of tegoed en probeer het daarna opnieuw.";
  if (status >= 500) return "OpenAI is tijdelijk niet bereikbaar. Probeer het over een minuut opnieuw.";
  return "De AI-aanvraag werd niet geaccepteerd. Probeer het opnieuw; blijft dit zo, laat het ons weten.";
}

function outputText(result: { output_text?: unknown; output?: unknown }) {
  if (typeof result.output_text === "string" && result.output_text.trim()) return result.output_text;
  if (!Array.isArray(result.output)) return "";
  return result.output.flatMap((item) => {
    if (!item || typeof item !== "object" || !("content" in item) || !Array.isArray(item.content)) return [];
    return item.content.flatMap((content: unknown) => content && typeof content === "object" && "text" in content && typeof content.text === "string" ? [content.text] : []);
  }).join("");
}

const schema = {
  type: "object", additionalProperties: false,
  properties: {
    reply: { type: "string" },
    complete: { type: "boolean" },
    title: { type: "string" },
    actualLocation: { type: "string" },
    body: { type: "string" },
  },
  required: ["reply", "complete", "title", "actualLocation", "body"],
};

function validMessages(value: unknown): value is Message[] {
  return Array.isArray(value) && value.length <= 12 && value.every((message) =>
    message && (message.role === "assistant" || message.role === "user") && typeof message.text === "string" && message.text.length <= 4000);
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });
    const payload = await request.json();
    if (!validUuid(payload.tripDayId) || !validMessages(payload.messages) || (payload.finish !== undefined && typeof payload.finish !== "boolean")) return NextResponse.json({ error: "Ongeldig interview." }, { status: 400 });

    const { data: day } = await supabase.from("trip_days")
      .select("id,title,planned_location,planned_route,day_number,day_date,day_entries(id,title,actual_location,body,media_assets(original_filename,caption,captured_at))")
      .eq("id", payload.tripDayId).single();
    if (!day) return NextResponse.json({ error: "Geen toegang tot deze reisdag." }, { status: 404 });

    const key = process.env.OPENAI_API_KEY;
    if (!key) return NextResponse.json({ error: "OpenAI is nog niet ingesteld." }, { status: 503 });
    const entry = Array.isArray(day.day_entries) ? day.day_entries[0] : day.day_entries;
    const context = JSON.stringify({
      planned: { title: day.title, location: day.planned_location, route: day.planned_route, date: day.day_date, number: day.day_number },
      currentDraft: entry ? { title: entry.title, location: entry.actual_location, body: entry.body } : null,
      photos: entry?.media_assets?.map((asset) => ({ filename: asset.original_filename, caption: asset.caption, capturedAt: asset.captured_at })) || [],
    });
    const prompt = `Je bent de warme, nieuwsgierige reisinterviewer van Henk en Michel. Spreek Nederlands. Gebruik de context alleen als geheugen, verzin geen feiten. Vraag steeds één leuke, concrete vervolgvraag. Verzamel zonder formulier zoveel mogelijk: werkelijke route/locatie, activiteiten, vervoer, verblijf, mensen, eten, sfeer, verrassingen, hoogtepunten en tips. Houd het bij maximaal 5 vragen totaal; zet complete=true zodra een bruikbaar dagverhaal mogelijk is of de gebruiker aangeeft klaar te zijn. Als complete=true, maak dan een aantrekkelijk, direct publiceerbaar reisverhaal. Schrijf het volledige body-veld consequent in de wij-vorm (wij, ons, onze) en nooit over 'jullie'. Gebruik 2 tot 4 korte Markdown-kopjes met ##, lege regels tussen alinea's en een warme, feitelijke reisvertelling. Geen AI-terugkoppeling, geen uitleg over het interview, geen verzonnen feiten en geen oproep om iets te controleren. ${payload.finish ? "De gebruiker kiest nu expliciet voor afronden: zet complete=true en maak het verslag uitsluitend op basis van wat al verteld is." : ""} Context: ${context}. Gesprek: ${JSON.stringify(payload.messages)}`;
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "gpt-5-mini", reasoning: { effort: "minimal" }, max_output_tokens: 1_600, input: prompt, text: { format: { type: "json_schema", name: "travel_interview", strict: true, schema } } }), signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) {
      console.error("OpenAI interview request failed", { status: response.status, category: "provider_rejected" });
      throw new InterviewError(openAiMessage(response.status), "provider_rejected");
    }
    const result = await response.json() as { output_text?: unknown; output?: unknown };
    const rawAnswer = outputText(result);
    if (!rawAnswer) throw new InterviewError("OpenAI gaf geen leesbaar antwoord terug. Probeer het opnieuw.", "empty_provider_output");
    let answer: { reply: string; complete: boolean; title: string; actualLocation: string; body: string };
    try { answer = JSON.parse(rawAnswer); } catch { throw new InterviewError("OpenAI gaf een onvolledig antwoord terug. Probeer het opnieuw.", "invalid_provider_output"); }
    if (typeof answer.reply !== "string" || !answer.reply.trim() || typeof answer.complete !== "boolean") throw new InterviewError("OpenAI gaf geen bruikbaar antwoord terug. Probeer het opnieuw.", "invalid_provider_output");
    const complete = payload.finish || answer.complete;
    const messages = [...payload.messages, { role: "assistant" as const, text: safeText(answer.reply, 2000) }];
    await supabase.from("day_interviews").upsert({ trip_day_id: day.id, messages, completed_at: complete ? new Date().toISOString() : null }, { onConflict: "trip_day_id" });
    if (complete) {
      await supabase.from("day_entries").upsert({ trip_day_id: day.id, title: safeText(answer.title, 160), actual_location: safeText(answer.actualLocation, 160), body: safeText(answer.body, 20_000) }, { onConflict: "trip_day_id" });
    }
    return NextResponse.json({ reply: messages.at(-1)?.text, complete });
  } catch (error) {
    const timedOut = error instanceof DOMException && error.name === "TimeoutError";
    const category = error instanceof InterviewError ? error.category : timedOut ? "provider_timeout" : "processing_failed";
    console.error("Interview processing failed", { category });
    const message = error instanceof InterviewError ? error.message : timedOut ? "OpenAI reageert te langzaam. Probeer het over een minuut opnieuw." : "Het interview kon nu niet worden verwerkt. Probeer het opnieuw.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
