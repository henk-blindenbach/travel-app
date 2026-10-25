"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { assembleSpeechTranscript, mergeDictationDraft } from "../../lib/speech-dictation";

type Message = { role: "assistant" | "user"; text: string };
type Props = { tripDayId: string; initialQuestion: string };

const DICTATION_MAX_MS = 120_000;
const DICTATION_RESTART_MS = 250;

export function InterviewChat({ tripDayId, initialQuestion }: Props) {
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", text: initialQuestion }]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [complete, setComplete] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceMessage, setVoiceMessage] = useState("");
  const [requestError, setRequestError] = useState("");
  const [draftSaved, setDraftSaved] = useState(false);
  const [retryAttempt, setRetryAttempt] = useState<{ messages: Message[]; finish: boolean } | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wantListeningRef = useRef(false);
  const intentionalStopRef = useRef(false);
  const baseDraftRef = useRef("");
  const draftRef = useRef("");
  const newestMessageRef = useRef<HTMLDivElement>(null);
  const answerCount = messages.filter((message) => message.role === "user").length;

  useEffect(() => { draftRef.current = draft; }, [draft]);

  function clearTimers() {
    if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
    stopTimerRef.current = null;
    restartTimerRef.current = null;
  }

  function detachRecognition() {
    const recognition = recognitionRef.current;
    recognitionRef.current = null;
    if (!recognition) return;
    recognition.onstart = null;
    recognition.onend = null;
    recognition.onerror = null;
    recognition.onresult = null;
  }

  function stopListening(options?: { intentional?: boolean }) {
    clearTimers();
    wantListeningRef.current = false;
    intentionalStopRef.current = Boolean(options?.intentional);
    const recognition = recognitionRef.current;
    detachRecognition();
    setListening(false);
    if (recognition) {
      try { recognition.stop(); } catch { /* already stopped */ }
    }
  }

  useEffect(() => () => {
    wantListeningRef.current = false;
    clearTimers();
    const recognition = recognitionRef.current;
    detachRecognition();
    try { recognition?.stop(); } catch { /* unmount */ }
  }, []);

  useEffect(() => { newestMessageRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [busy, complete, messages]);

  async function submit(next: Message[], finish: boolean) {
    if (busy || complete) return;
    stopListening({ intentional: true });
    setBusy(true);
    setRequestError("");
    setDraftSaved(false);
    setRetryAttempt(null);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 35_000);
    try {
      const response = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tripDayId, messages: next, finish }),
        signal: controller.signal,
      });
      const data = await response.json();
      if (!response.ok) {
        if (data.draftSaved) setDraftSaved(true);
        throw new Error(data.error || "Het antwoord kon niet worden opgehaald.");
      }
      if (typeof data.reply !== "string" || !data.reply.trim()) throw new Error("Er kwam geen vraag terug.");
      if (!data.complete) setMessages((current) => [...current, { role: "assistant", text: data.reply }]);
      setComplete(data.complete);
    } catch (error) {
      setRequestError(
        error instanceof DOMException && error.name === "AbortError"
          ? "Dit duurt langer dan normaal. Probeer het opnieuw."
          : error instanceof Error ? error.message : "Het antwoord kon niet worden opgehaald.",
      );
      setRetryAttempt({ messages: next, finish });
    } finally {
      window.clearTimeout(timeout);
      setBusy(false);
    }
  }

  async function send() {
    const clean = draft.trim();
    if (!clean || busy || complete) return;
    stopListening({ intentional: true });
    const next = [...messages, { role: "user" as const, text: clean }];
    setMessages(next);
    setDraft("");
    baseDraftRef.current = "";
    await submit(next, false);
  }

  async function finishInterview() {
    if (busy || complete) return;
    stopListening({ intentional: true });
    if (!messages.some((message) => message.role === "user")) {
      setRequestError("Vertel eerst iets over jullie dag; daarna kan Nós er een verslag van maken.");
      return;
    }
    await submit(messages, true);
  }

  function applySessionTranscript(sessionText: string) {
    setDraft(mergeDictationDraft(baseDraftRef.current, sessionText));
  }

  function startRecognition() {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      setVoiceMessage("Spraakherkenning wordt niet ondersteund in deze browser. Je kunt natuurlijk typen.");
      wantListeningRef.current = false;
      setListening(false);
      return;
    }

    intentionalStopRef.current = false;
    const recognition = new Recognition();
    recognitionRef.current = recognition;
    recognition.lang = "nl-NL";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setListening(true);
      setVoiceMessage("");
    };

    recognition.onresult = (event) => {
      applySessionTranscript(assembleSpeechTranscript(event.results));
    };

    recognition.onerror = (event) => {
      if (intentionalStopRef.current || event.error === "aborted") return;
      if (event.error === "no-speech") {
        // Keep listening intent; onend may restart for the next utterance block.
        return;
      }
      wantListeningRef.current = false;
      const message = event.error === "not-allowed" || event.error === "service-not-allowed"
        ? "Geef Nós toegang tot je microfoon in de browserinstellingen en probeer opnieuw."
        : "De spraakopname stopte onverwacht. Je kunt het nog eens proberen of typen.";
      setVoiceMessage(message);
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      if (!wantListeningRef.current || intentionalStopRef.current) {
        setListening(false);
        return;
      }
      // Browser ended after a speech block — restart so consecutive blocks keep writing.
      baseDraftRef.current = draftRef.current;
      restartTimerRef.current = setTimeout(() => {
        restartTimerRef.current = null;
        if (!wantListeningRef.current || intentionalStopRef.current) {
          setListening(false);
          return;
        }
        try { startRecognition(); }
        catch {
          wantListeningRef.current = false;
          setListening(false);
          setVoiceMessage("De spraakopname kon niet opnieuw starten. Tik nog eens op Vertellen of typ verder.");
        }
      }, DICTATION_RESTART_MS);
    };

    try {
      recognition.start();
    } catch {
      detachRecognition();
      wantListeningRef.current = false;
      setListening(false);
      setVoiceMessage("De spraakopname kon niet starten. Probeer het nog eens of typ je antwoord.");
    }
  }

  function dictate() {
    if (wantListeningRef.current || recognitionRef.current) {
      stopListening({ intentional: true });
      return;
    }
    if (busy || complete) return;
    setVoiceMessage("");
    baseDraftRef.current = draftRef.current;
    wantListeningRef.current = true;
    setListening(true);
    clearTimers();
    stopTimerRef.current = setTimeout(() => {
      stopListening({ intentional: true });
      setVoiceMessage("Opname gestopt na twee minuten. Tik opnieuw op Vertellen om verder te gaan.");
    }, DICTATION_MAX_MS);
    startRecognition();
  }

  return (
    <div className="chat">
      {messages.map((message, index) => (
        <div key={`${message.role}-${index}`} className={`chat-bubble ${message.role}`}>
          <p>{message.role === "assistant" && index === 0 ? "Vraag 1 · " : ""}{message.text}</p>
        </div>
      ))}
      {busy && <div className="chat-bubble assistant"><p>Even luisteren en ordenen…</p></div>}
      <div ref={newestMessageRef} />
      {complete ? (
        <div className="interview-complete">
          <Link className="primary-button blue-button" href={`/app/journal/${tripDayId}`}>Open conceptdagverslag →</Link>
        </div>
      ) : (
        <div className="interview-compose">
          <textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Vertel het gewoon zoals je het zou zeggen…" rows={3} />
          {voiceMessage && <p className="voice-message" role="status">{voiceMessage}</p>}
          {requestError && (
            <p className="voice-message" role="alert">
              {requestError}{" "}
              {draftSaved ? <Link className="text-button" href={`/app/journal/${tripDayId}`}>Open concept →</Link> : null}{" "}
              {retryAttempt && (
                <button type="button" className="text-button" onClick={() => void submit(retryAttempt.messages, retryAttempt.finish)}>
                  Opnieuw proberen
                </button>
              )}
            </p>
          )}
          {answerCount >= 5 && <p className="voice-message">We hebben genoeg voor een mooi verslag. Je kunt nog aanvullen of nu afronden.</p>}
          <div>
            <button type="button" className="secondary-button" onClick={dictate} disabled={busy}>
              {listening ? "Opname stoppen" : "🎙 Vertellen"}
            </button>
            <button type="button" className="primary-button blue-button" onClick={() => void send()} disabled={busy || !draft.trim()}>Stuur antwoord</button>
          </div>
          <button type="button" className="finish-button" onClick={() => void finishInterview()} disabled={busy}>
            Maak dagverslag met wat ik al vertelde →
          </button>
        </div>
      )}
    </div>
  );
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}
interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}
interface SpeechRecognitionEvent extends Event {
  results: ArrayLike<{ isFinal?: boolean; [index: number]: { transcript: string } }>;
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}
