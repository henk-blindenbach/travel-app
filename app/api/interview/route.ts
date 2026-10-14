import { NextResponse } from "next/server";
import { safeText, validUuid } from "../../../lib/journal";
import { createClient } from "../../../lib/supabase/server";

export const runtime = "nodejs";

type Message = { role: "assistant" | "user"; text: string };

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
    if (!validUuid(payload.tripDayId) || !validMessages(payload.messages)) return NextResponse.json({ error: "Ongeldig interview." }, { status: 400 });

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
    const prompt = `Je bent de warme, nieuwsgierige reisinterviewer van Henk en Michel. Spreek Nederlands. Gebruik de context alleen als geheugen, verzin geen feiten. Vraag steeds één leuke, concrete vervolgvraag. Verzamel zonder formulier zoveel mogelijk: werkelijke route/locatie, activiteiten, vervoer, verblijf, mensen, eten, sfeer, verrassingen, hoogtepunten en tips. Houd het bij maximaal 5 vragen totaal; zet complete=true zodra een bruikbaar dagverhaal mogelijk is of de gebruiker aangeeft klaar te zijn. Als complete=true, maak dan een aantrekkelijke private concepttitel, locatie en volledig verhaal. Context: ${context}. Gesprek: ${JSON.stringify(payload.messages)}`;
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "gpt-5-mini", input: prompt, text: { format: { type: "json_schema", name: "travel_interview", strict: true, schema } } }),
    });
    if (!response.ok) throw new Error("OpenAI request failed");
    const result = await response.json() as { output_text?: string };
    const answer = JSON.parse(result.output_text || "{}") as { reply: string; complete: boolean; title: string; actualLocation: string; body: string };
    const messages = [...payload.messages, { role: "assistant" as const, text: safeText(answer.reply, 2000) }];
    await supabase.from("day_interviews").upsert({ trip_day_id: day.id, messages, completed_at: answer.complete ? new Date().toISOString() : null }, { onConflict: "trip_day_id" });
    if (answer.complete) {
      await supabase.from("day_entries").upsert({ trip_day_id: day.id, title: safeText(answer.title, 160), actual_location: safeText(answer.actualLocation, 160), body: safeText(answer.body, 20_000) }, { onConflict: "trip_day_id" });
    }
    return NextResponse.json({ reply: messages.at(-1)?.text, complete: answer.complete });
  } catch {
    return NextResponse.json({ error: "Het interview kon nu niet worden verwerkt. Probeer het opnieuw." }, { status: 500 });
  }
}
