"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type Message = { role: "assistant" | "user"; text: string };
type Props = { tripDayId: string; initialQuestion: string };

export function InterviewChat({ tripDayId, initialQuestion }: Props) {
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", text: initialQuestion }]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [complete, setComplete] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceMessage, setVoiceMessage] = useState("");
  const [requestError, setRequestError] = useState("");
  const [retryAttempt, setRetryAttempt] = useState<{ messages: Message[]; finish: boolean } | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const newestMessageRef = useRef<HTMLDivElement>(null);
  const answerCount = messages.filter((message) => message.role === "user").length;

  function stopListening() {
    if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    stopTimerRef.current = null;
    recognitionRef.current = null;
    setListening(false);
  }

  useEffect(() => () => {
    if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    recognitionRef.current?.stop();
  }, []);

  useEffect(() => { newestMessageRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [busy, complete, messages]);

  async function submit(next: Message[], finish: boolean) {
    if (busy || complete) return;
    setBusy(true);
    setRequestError("");
    setRetryAttempt(null);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 35_000);
    try {
      const response = await fetch("/api/interview", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tripDayId, messages: next, finish }), signal: controller.signal });
      const data = await response.json(); if (!response.ok) throw new Error(data.error);
      if (typeof data.reply !== "string" || !data.reply.trim()) throw new Error("Er kwam geen vraag terug.");
      if (!data.complete) setMessages((current) => [...current, { role: "assistant", text: data.reply }]);
      setComplete(data.complete);
    } catch (error) {
      setRequestError(error instanceof DOMException && error.name === "AbortError" ? "Dit duurt langer dan normaal. Probeer het opnieuw." : error instanceof Error ? error.message : "Het antwoord kon niet worden opgehaald.");
      setRetryAttempt({ messages: next, finish });
    } finally { window.clearTimeout(timeout); setBusy(false); }
  }

  async function send() {
    const clean = draft.trim(); if (!clean || busy || complete) return;
    const next = [...messages, { role: "user" as const, text: clean }];
    setMessages(next);
    setDraft("");
    await submit(next, false);
  }

  async function finishInterview() {
    if (busy || complete) return;
    if (!messages.some((message) => message.role === "user")) {
      setRequestError("Vertel eerst iets over jullie dag; daarna kan Nós er een verslag van maken.");
      return;
    }
    await submit(messages, true);
  }

  function dictate() {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) { setVoiceMessage("Spraakherkenning wordt niet ondersteund in deze browser. Je kunt natuurlijk typen."); return; }
    setVoiceMessage("");
    const recognition = new Recognition();
    recognitionRef.current = recognition;
    recognition.lang = "nl-NL";
    recognition.interimResults = true;
    recognition.onstart = () => {
      setListening(true);
      stopTimerRef.current = setTimeout(() => recognition.stop(), 20_000);
    };
    recognition.onend = stopListening;
    recognition.onerror = (event) => {
      const message = event.error === "not-allowed" || event.error === "service-not-allowed"
        ? "Geef Nós toegang tot je microfoon in de browserinstellingen en probeer opnieuw."
        : event.error === "no-speech"
          ? "Ik hoorde geen spraak. Probeer het nog eens of typ je antwoord."
          : "De spraakopname stopte onverwacht. Je kunt het nog eens proberen of typen.";
      setVoiceMessage(message);
    };
    recognition.onresult = (event) => setDraft(Array.from(event.results).map((item) => item[0].transcript).join(""));
    try { recognition.start(); } catch { stopListening(); setVoiceMessage("De spraakopname kon niet starten. Probeer het nog eens of typ je antwoord."); }
  }

  return <div className="chat">{messages.map((message, index) => <div key={`${message.role}-${index}`} className={`chat-bubble ${message.role}`}><p>{message.role === "assistant" && index === 0 ? "Vraag 1 · " : ""}{message.text}</p></div>)}
    {busy && <div className="chat-bubble assistant"><p>Even luisteren en ordenen…</p></div>}
    <div ref={newestMessageRef}/>
    {complete ? <div className="interview-complete"><Link className="primary-button blue-button" href={`/app/journal/${tripDayId}`}>Open conceptdagverslag →</Link></div> : <div className="interview-compose"><textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Vertel het gewoon zoals je het zou zeggen…" rows={3}/>{voiceMessage && <p className="voice-message" role="status">{voiceMessage}</p>}{requestError && <p className="voice-message" role="alert">{requestError} {retryAttempt && <button type="button" className="text-button" onClick={() => void submit(retryAttempt.messages, retryAttempt.finish)}>Opnieuw proberen</button>}</p>}{answerCount >= 5 && <p className="voice-message">We hebben genoeg voor een mooi verslag. Je kunt nog aanvullen of nu afronden.</p>}<div><button type="button" className="secondary-button" onClick={dictate}>{listening ? "Opname stoppen" : "🎙 Vertellen"}</button><button type="button" className="primary-button blue-button" onClick={() => void send()} disabled={busy || !draft.trim()}>Stuur antwoord</button></div><button type="button" className="finish-button" onClick={() => void finishInterview()} disabled={busy}>Maak dagverslag met wat ik al vertelde →</button></div>}</div>;
}

declare global { interface Window { SpeechRecognition?: new () => SpeechRecognition; webkitSpeechRecognition?: new () => SpeechRecognition; } }
interface SpeechRecognition extends EventTarget { lang: string; interimResults: boolean; onstart: (() => void) | null; onend: (() => void) | null; onresult: ((event: SpeechRecognitionEvent) => void) | null; onerror: ((event: SpeechRecognitionErrorEvent) => void) | null; start(): void; stop(): void; }
interface SpeechRecognitionEvent extends Event { results: ArrayLike<{ [index: number]: { transcript: string } }>; }
interface SpeechRecognitionErrorEvent extends Event { error: string; }
