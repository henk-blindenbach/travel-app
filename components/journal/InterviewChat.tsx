"use client";

import { useState } from "react";

type Message = { role: "assistant" | "user"; text: string };
type Props = { tripDayId: string; initialQuestion: string };

export function InterviewChat({ tripDayId, initialQuestion }: Props) {
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", text: initialQuestion }]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [complete, setComplete] = useState(false);
  const [listening, setListening] = useState(false);

  async function send(text = draft) {
    const clean = text.trim(); if (!clean || busy || complete) return;
    const next = [...messages, { role: "user" as const, text: clean }]; setMessages(next); setDraft(""); setBusy(true);
    try {
      const response = await fetch("/api/interview", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tripDayId, messages: next }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error);
      setMessages((current) => [...current, { role: "assistant", text: data.reply }]); setComplete(data.complete);
    } catch (error) { setMessages((current) => [...current, { role: "assistant", text: error instanceof Error ? error.message : "Probeer het nog eens." }]); }
    finally { setBusy(false); }
  }

  function dictate() {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) { setDraft("Spraakherkenning wordt niet ondersteund in deze browser. Je kunt natuurlijk typen."); return; }
    const recognition = new Recognition(); recognition.lang = "nl-NL"; recognition.interimResults = true;
    recognition.onstart = () => setListening(true); recognition.onend = () => setListening(false);
    recognition.onresult = (event) => setDraft(Array.from(event.results).map((item) => item[0].transcript).join("")); recognition.start();
  }

  return <div className="chat">{messages.map((message, index) => <div key={`${message.role}-${index}`} className={`chat-bubble ${message.role}`}><p>{message.text}</p></div>)}
    {busy && <div className="chat-bubble assistant"><p>Even luisteren en ordenen…</p></div>}
    {complete ? <p className="form-message">Conceptdagverslag gemaakt. Je kunt het nu in je dagverslag bekijken en aanpassen.</p> : <div className="interview-compose"><textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Vertel het gewoon zoals je het zou zeggen…" rows={3}/><div><button type="button" className="secondary-button" onClick={dictate}>{listening ? "Luistert…" : "🎙 Vertellen"}</button><button type="button" className="primary-button blue-button" onClick={() => void send()} disabled={busy}>Verder →</button></div></div>}</div>;
}

declare global { interface Window { SpeechRecognition?: new () => SpeechRecognition; webkitSpeechRecognition?: new () => SpeechRecognition; } }
interface SpeechRecognition extends EventTarget { lang: string; interimResults: boolean; onstart: (() => void) | null; onend: (() => void) | null; onresult: ((event: SpeechRecognitionEvent) => void) | null; start(): void; }
interface SpeechRecognitionEvent extends Event { results: ArrayLike<{ [index: number]: { transcript: string } }>; }
