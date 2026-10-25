import { NextResponse } from "next/server";
import {
  AI_BASIS_MAX_CHARS,
  buildInterviewContext,
  EARLIER_JOURNAL_MAX_DAYS,
  INTERVIEW_STORY_STYLE,
} from "../../../lib/interview-context";
import { safeText, validUuid } from "../../../lib/journal";
import { openAiUserMessage, outputText } from "../../../lib/openai-text";
import { createClient } from "../../../lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 35;

type Message = { role: "assistant" | "user"; text: string };

class InterviewError extends Error {
  constructor(message: string, readonly category: string) { super(message); }
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
  return Array.isArray(value) && value.length <= 24 && value.every((message) =>
    message && (message.role === "assistant" || message.role === "user") && typeof message.text === "string" && message.text.length <= 4000);
}

function answersAsPlainText(messages: Message[]) {
  return messages
    .filter((message) => message.role === "user" && message.text.trim())
    .map((message, index) => `Antwoord ${index + 1}\n${message.text.trim()}`)
    .join("\n\n");
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });
    const payload = await request.json();
    if (!validUuid(payload.tripDayId) || !validMessages(payload.messages) || (payload.finish !== undefined && typeof payload.finish !== "boolean")) {
      return NextResponse.json({ error: "Ongeldig interview." }, { status: 400 });
    }

    const { data: day } = await supabase.from("trip_days")
      .select("id,title,planned_location,planned_route,day_number,day_date,trip_id,day_entries(id,title,actual_location,body,media_assets(original_filename,caption,captured_at))")
      .eq("id", payload.tripDayId).single();
    if (!day) return NextResponse.json({ error: "Geen toegang tot deze reisdag." }, { status: 404 });

    const key = process.env.OPENAI_API_KEY;
    if (!key) return NextResponse.json({ error: "OpenAI is nog niet ingesteld." }, { status: 503 });
    const entry = Array.isArray(day.day_entries) ? day.day_entries[0] : day.day_entries;

    const [{ data: trip }, { data: planningItems }, { data: earlierEntries }] = await Promise.all([
      supabase.from("trips").select("ai_basis").eq("id", day.trip_id).maybeSingle(),
      supabase
        .from("planning_items")
        .select("kind,status,title,details,location,departure_time,arrival_time,arrives_on,ends_on,carrier,flight_number,address,duration_minutes,sort_order")
        .eq("trip_day_id", day.id)
        .order("sort_order", { ascending: true }),
      supabase
        .from("day_entries")
        .select("day_number,day_date,title,actual_location,body")
        .eq("trip_id", day.trip_id)
        .lt("day_number", day.day_number)
        .not("body", "eq", "")
        .order("day_number", { ascending: false })
        .limit(EARLIER_JOURNAL_MAX_DAYS * 2),
    ]);

    const context = JSON.stringify(buildInterviewContext({
      aiBasis: trip?.ai_basis ? safeText(trip.ai_basis, AI_BASIS_MAX_CHARS) : null,
      day: {
        title: day.title,
        planned_location: day.planned_location,
        planned_route: day.planned_route,
        day_date: day.day_date,
        day_number: day.day_number,
      },
      entry,
      planningItems: planningItems || [],
      earlierJournal: earlierEntries || [],
    }));
    const finishing = Boolean(payload.finish);
    const prompt = `Je bent de warme, nieuwsgierige reisinterviewer van Henk en Michel. Michel is Henk's mannelijke partner; schrijf zijn naam altijd precies als Michel, nooit Michelle. Spreek Nederlands. Gebruik de context alleen als geheugen (eerdere dagen, planning van vandaag, trip AI-basis, concept en foto's), verzin geen feiten en herhaal eerdere dagen niet als nieuw. Vraag steeds één leuke, concrete vervolgvraag. Verzamel zonder formulier zoveel mogelijk: werkelijke route/locatie, activiteiten, vervoer, verblijf, mensen, eten, sfeer, verrassingen, hoogtepunten en tips. Houd het bij maximaal 5 vragen totaal; zet complete=true zodra een bruikbaar dagverhaal mogelijk is of de gebruiker aangeeft klaar te zijn. ${INTERVIEW_STORY_STYLE} Geen AI-terugkoppeling, geen uitleg over het interview, geen verzonnen feiten en geen oproep om iets te controleren. ${finishing ? "De gebruiker kiest nu expliciet voor afronden: zet complete=true en maak het verslag uitsluitend op basis van wat al verteld is (context mag kleuren, niet feiten verzinnen)." : "Dit is een vervolgbeurt in het gesprek: zet complete=false tenzij het verhaal al duidelijk genoeg is, vul reply met precies één korte vraag, en zet title, actualLocation en body op lege strings — schrijf nog geen verslag."} Context: ${context}. Gesprek: ${JSON.stringify(payload.messages)}`;

    let answer: { reply: string; complete: boolean; title: string; actualLocation: string; body: string };
    try {
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "gpt-5-mini",
          reasoning: { effort: "minimal" },
          // Follow-ups only need a short question; finishing needs the full story.
          max_output_tokens: finishing ? 3_200 : 800,
          input: prompt,
          text: { format: { type: "json_schema", name: "travel_interview", strict: true, schema } },
        }),
        signal: AbortSignal.timeout(30_000),
      });
      if (!response.ok) {
        console.error("OpenAI interview request failed", { status: response.status, category: "provider_rejected" });
        throw new InterviewError(openAiUserMessage(response.status), "provider_rejected");
      }
      const result = await response.json() as { status?: unknown; output_text?: unknown; output?: unknown };
      const rawAnswer = outputText(result);
      if (!rawAnswer) throw new InterviewError("OpenAI gaf geen leesbaar antwoord terug. Probeer het opnieuw.", "empty_provider_output");
      if (result.status === "incomplete") {
        console.error("OpenAI interview response incomplete", { category: "incomplete_provider_output" });
        throw new InterviewError("OpenAI gaf een onvolledig antwoord terug. Probeer het opnieuw.", "incomplete_provider_output");
      }
      try { answer = JSON.parse(rawAnswer); }
      catch { throw new InterviewError("OpenAI gaf een onvolledig antwoord terug. Probeer het opnieuw.", "invalid_provider_output"); }
      if (typeof answer.reply !== "string" || !answer.reply.trim() || typeof answer.complete !== "boolean") {
        throw new InterviewError("OpenAI gaf geen bruikbaar antwoord terug. Probeer het opnieuw.", "invalid_provider_output");
      }
      if (!finishing && !answer.complete) {
        answer.title = "";
        answer.actualLocation = "";
        answer.body = "";
      }
    } catch (error) {
      const userAnswers = answersAsPlainText(payload.messages);
      if (userAnswers) {
        await supabase.from("day_interviews").upsert(
          { trip_day_id: day.id, messages: payload.messages, completed_at: null },
          { onConflict: "trip_day_id" },
        );
        await supabase.from("day_entries").upsert({
          trip_day_id: day.id,
          trip_id: day.trip_id,
          day_number: day.day_number,
          day_date: day.day_date,
          title: safeText(entry?.title || day.title || "Interviewconcept", 160),
          actual_location: safeText(entry?.actual_location || day.planned_location || "", 160),
          body: safeText(userAnswers, 20_000),
        }, { onConflict: "trip_day_id" });
      }
      const timedOut = error instanceof DOMException && error.name === "TimeoutError";
      const category = error instanceof InterviewError ? error.category : timedOut ? "provider_timeout" : "processing_failed";
      console.error("Interview AI failed; plain-text draft saved", { category, savedAnswers: Boolean(userAnswers) });
      const message = error instanceof InterviewError
        ? error.message
        : timedOut
          ? "OpenAI reageert te langzaam. Je antwoorden staan als platte tekst in het concept."
          : "Het interview kon nu niet worden verwerkt. Je antwoorden staan als platte tekst in het concept.";
      return NextResponse.json({ error: message, draftSaved: Boolean(userAnswers) }, { status: 500 });
    }

    const complete = payload.finish || answer.complete;
    const messages = [...payload.messages, { role: "assistant" as const, text: safeText(answer.reply, 2000) }];
    await supabase.from("day_interviews").upsert({ trip_day_id: day.id, messages, completed_at: complete ? new Date().toISOString() : null }, { onConflict: "trip_day_id" });
    if (complete) {
      await supabase.from("day_entries").upsert({
        trip_day_id: day.id,
        trip_id: day.trip_id,
        day_number: day.day_number,
        day_date: day.day_date,
        title: safeText(answer.title, 160),
        actual_location: safeText(answer.actualLocation, 160),
        body: safeText(answer.body, 20_000),
      }, { onConflict: "trip_day_id" });
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
