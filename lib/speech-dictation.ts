/** Pure helpers for browser SpeechRecognition → draft text. */

export type SpeechResultLike = {
  isFinal?: boolean;
  0?: { transcript?: string };
};

/** Join one recognition session’s results into a single transcript. */
export function assembleSpeechTranscript(results: ArrayLike<SpeechResultLike>) {
  const parts: string[] = [];
  for (let index = 0; index < results.length; index += 1) {
    const text = results[index]?.[0]?.transcript?.trim();
    if (text) parts.push(text);
  }
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

/** Keep earlier typed/dictated text when a new speech session starts. */
export function mergeDictationDraft(base: string, sessionText: string) {
  const left = base.trim();
  const right = sessionText.trim();
  if (!left) return right;
  if (!right) return left;
  if (right.startsWith(left)) return right;
  const needsSpace = !/\s$/.test(left) && !/^[,.;:!?]/.test(right);
  return `${left}${needsSpace ? " " : ""}${right}`;
}
