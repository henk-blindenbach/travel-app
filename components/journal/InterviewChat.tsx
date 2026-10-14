"use client";

import { useEffect, useRef, useState } from "react";

type Message = { role: "assistant" | "user"; text: string };
type Props = { tripDayId: string; initialQuestion: string };

export function InterviewChat({ tripDayId, initialQuestion }: Props) {
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", text: initialQuestion }]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [complete, setComplete] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceMessage, setVoiceMessage] = useState("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  return <div className="chat">{messages.map((message, index) => <div key={`${message.role}-${index}`} className={`chat-bubble ${message.role}`}><p>{message.text}</p></div>)}
    {busy && <div className="chat-bubble assistant"><p>Even luisteren en ordenen…</p></div>}
    {complete ? <p className="form-message">Conceptdagverslag gemaakt. Je kunt het nu in je dagverslag bekijken en aanpassen.</p> : <div className="interview-compose"><textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Vertel het gewoon zoals je het zou zeggen…" rows={3}/>{voiceMessage && <p className="voice-message" role="status">{voiceMessage}</p>}<div><button type="button" className="secondary-button" onClick={dictate}>{listening ? "Opname stoppen" : "🎙 Vertellen"}</button><button type="button" className="primary-button blue-button" onClick={() => void send()} disabled={busy}>Verder →</button></div></div>}</div>;
}

declare global { interface Window { SpeechRecognition?: new () => SpeechRecognition; webkitSpeechRecognition?: new () => SpeechRecognition; } }
interface SpeechRecognition extends EventTarget { lang: string; interimResults: boolean; onstart: (() => void) | null; onend: (() => void) | null; onresult: ((event: SpeechRecognitionEvent) => void) | null; onerror: ((event: SpeechRecognitionErrorEvent) => void) | null; start(): void; stop(): void; }
interface SpeechRecognitionEvent extends Event { results: ArrayLike<{ [index: number]: { transcript: string } }>; }
interface SpeechRecognitionErrorEvent extends Event { error: string; }
