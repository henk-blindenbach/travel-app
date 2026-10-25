"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { assembleSpeechTranscript, mergeDictationDraft } from "../../lib/speech-dictation";

type Message = { role: "assistant" | "user"; text: string };
type Props = { tripDayId: string; initialQuestion: string };

const DICTATION_MAX_MS = 120_000;
const DICTATION_RESTART_MS = 280;
const EDIT_RESTART_MS = 350;

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
  const recognitionEngineRef = useRef<SpeechRecognition | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editRestartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wantListeningRef = useRef(false);
  const intentionalStopRef = useRef(false);
  const startingRef = useRef(false);
  const baseDraftRef = useRef("");
  const draftRef = useRef("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const newestMessageRef = useRef<HTMLDivElement>(null);
  const answerCount = messages.filter((message) => message.role === "user").length;

  useEffect(() => { draftRef.current = draft; }, [draft]);

  function clearTimers() {
    if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
    if (editRestartTimerRef.current) clearTimeout(editRestartTimerRef.current);
    stopTimerRef.current = null;
    restartTimerRef.current = null;
    editRestartTimerRef.current = null;
  }

  function releaseMic() {
    const stream = micStreamRef.current;
    micStreamRef.current = null;
    stream?.getTracks().forEach((track) => {
      try { track.stop(); } catch { /* already stopped */ }
    });
  }

  function clearRecognitionHandlers(recognition: SpeechRecognition | null) {
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
    startingRef.current = false;
    const recognition = recognitionRef.current || recognitionEngineRef.current;
    recognitionRef.current = null;
    // Clear handlers before stop so onend cannot schedule another restart.
    clearRecognitionHandlers(recognition);
    setListening(false);
    if (recognition) {
      try { recognition.stop(); } catch { /* already stopped */ }
    }
    // Keep the MediaStream alive for this interview page so the next Vertellen
    // reuses the already-granted mic permission instead of prompting again.
  }

  useEffect(() => () => {
    wantListeningRef.current = false;
    clearTimers();
    const recognition = recognitionEngineRef.current;
    recognitionRef.current = null;
    clearRecognitionHandlers(recognition);
    try { recognition?.abort?.(); } catch { /* unmount */ }
    try { recognition?.stop(); } catch { /* unmount */ }
    recognitionEngineRef.current = null;
    releaseMic();
  }, []);

  useEffect(() => { newestMessageRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [busy, complete, messages]);

  function hasLiveMic() {
    return Boolean(micStreamRef.current?.getTracks().some((track) => track.readyState === "live"));
  }

  async function ensureMicPermission() {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) return true;
    if (hasLiveMic()) return true;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      return true;
    } catch {
      setVoiceMessage("Geef Nós toegang tot je microfoon in de browserinstellingen en probeer opnieuw.");
      return false;
    }
  }

  function getRecognitionEngine() {
    if (recognitionEngineRef.current) return recognitionEngineRef.current;
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) return null;
    const recognition = new Recognition();
    recognition.lang = "nl-NL";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognitionEngineRef.current = recognition;
    return recognition;
  }

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
      if (data.complete) releaseMic();
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

  function focusDraftField() {
    const field = textareaRef.current;
    if (!field) return;
    try {
      field.focus({ preventScroll: true });
    } catch {
      field.focus();
    }
  }

  function scheduleRecognitionRestart(delay = DICTATION_RESTART_MS) {
    if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
    restartTimerRef.current = setTimeout(() => {
      restartTimerRef.current = null;
      if (!wantListeningRef.current || intentionalStopRef.current) {
        setListening(false);
        return;
      }
      void startRecognition({ ensureMic: false });
    }, delay);
  }

  function softRestartAfterEdit() {
    // Drop the in-flight SpeechRecognition result list so corrected/cleared text is not overwritten.
    baseDraftRef.current = draftRef.current;
    const recognition = recognitionRef.current || recognitionEngineRef.current;
    if (!recognition || !wantListeningRef.current) return;
    intentionalStopRef.current = false;
    try { recognition.stop(); } catch { scheduleRecognitionRestart(EDIT_RESTART_MS); }
  }

  function handleDraftChange(value: string) {
    setDraft(value);
    draftRef.current = value;
    if (!wantListeningRef.current) return;
    baseDraftRef.current = value;
    if (editRestartTimerRef.current) clearTimeout(editRestartTimerRef.current);
    editRestartTimerRef.current = setTimeout(() => {
      editRestartTimerRef.current = null;
      if (!wantListeningRef.current) return;
      softRestartAfterEdit();
    }, EDIT_RESTART_MS);
  }

  async function startRecognition(options?: { ensureMic?: boolean }) {
    if (!wantListeningRef.current || intentionalStopRef.current || startingRef.current) return;
    const recognition = getRecognitionEngine();
    if (!recognition) {
      setVoiceMessage("Spraakherkenning wordt niet ondersteund in deze browser. Je kunt natuurlijk typen.");
      wantListeningRef.current = false;
      setListening(false);
      return;
    }

    // Restarts after onend already hold a live stream — skip await so start() stays snappy.
    if (options?.ensureMic !== false && !hasLiveMic()) {
      const micOk = await ensureMicPermission();
      if (!micOk || !wantListeningRef.current || intentionalStopRef.current) {
        wantListeningRef.current = false;
        setListening(false);
        return;
      }
    }

    focusDraftField();
    intentionalStopRef.current = false;
    startingRef.current = true;
    recognitionRef.current = recognition;

    recognition.onstart = () => {
      startingRef.current = false;
      setListening(true);
      setVoiceMessage("");
      focusDraftField();
    };

    recognition.onresult = (event) => {
      applySessionTranscript(assembleSpeechTranscript(event.results));
    };

    recognition.onerror = (event) => {
      startingRef.current = false;
      if (intentionalStopRef.current || event.error === "aborted") return;
      if (event.error === "no-speech") return;
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        wantListeningRef.current = false;
        setListening(false);
        setVoiceMessage("Geef Nós toegang tot je microfoon in de browserinstellingen en probeer opnieuw.");
        return;
      }
      // Keep listening intent; onend restarts the same engine for the next utterance.
    };

    recognition.onend = () => {
      startingRef.current = false;
      recognitionRef.current = null;
      if (!wantListeningRef.current || intentionalStopRef.current) {
        setListening(false);
        return;
      }
      baseDraftRef.current = draftRef.current;
      scheduleRecognitionRestart();
    };

    try {
      recognition.start();
    } catch (error) {
      startingRef.current = false;
      // InvalidStateError: engine still settling — retry shortly on the same instance.
      const busyEngine = error instanceof DOMException && error.name === "InvalidStateError";
      if (busyEngine && wantListeningRef.current) {
        scheduleRecognitionRestart(DICTATION_RESTART_MS);
        return;
      }
      recognitionRef.current = null;
      clearRecognitionHandlers(recognition);
      wantListeningRef.current = false;
      setListening(false);
      setVoiceMessage("De spraakopname kon niet starten. Probeer het nog eens of typ je antwoord.");
    }
  }

  async function dictate() {
    if (wantListeningRef.current || recognitionRef.current || startingRef.current) {
      stopListening({ intentional: true });
      return;
    }
    if (busy || complete) return;
    setVoiceMessage("");
    baseDraftRef.current = draftRef.current;
    wantListeningRef.current = true;
    intentionalStopRef.current = false;
    setListening(true);
    clearTimers();
    focusDraftField();
    // Warm mic in the Vertellen click path once; keep the stream for later Vertellen clicks.
    const micOk = await ensureMicPermission();
    if (!micOk || !wantListeningRef.current) {
      wantListeningRef.current = false;
      setListening(false);
      return;
    }
    focusDraftField();
    stopTimerRef.current = setTimeout(() => {
      stopListening({ intentional: true });
      setVoiceMessage("Opname gestopt na twee minuten. Tik opnieuw op Vertellen om verder te gaan.");
    }, DICTATION_MAX_MS);
    await startRecognition({ ensureMic: false });
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
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(event) => handleDraftChange(event.target.value)}
            placeholder="Vertel het gewoon zoals je het zou zeggen…"
            rows={3}
          />
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
            <button type="button" className="secondary-button" onClick={() => void dictate()} disabled={busy}>
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
  abort?: () => void;
}
interface SpeechRecognitionEvent extends Event {
  results: ArrayLike<{ isFinal?: boolean; [index: number]: { transcript: string } }>;
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}
