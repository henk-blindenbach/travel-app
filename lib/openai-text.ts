/** Extract plain text from an OpenAI Responses API payload. */
export function outputText(result: { output_text?: unknown; output?: unknown }) {
  if (typeof result.output_text === "string" && result.output_text.trim()) return result.output_text;
  if (!Array.isArray(result.output)) return "";
  return result.output.flatMap((item) => {
    if (!item || typeof item !== "object" || !("content" in item) || !Array.isArray(item.content)) return [];
    return item.content.flatMap((content: unknown) =>
      content && typeof content === "object" && "text" in content && typeof content.text === "string" ? [content.text] : [],
    );
  }).join("");
}

export function openAiUserMessage(status: number) {
  if (status === 401 || status === 403) return "OpenAI accepteert de API-sleutel niet. Controleer OPENAI_API_KEY in Vercel.";
  if (status === 429) return "OpenAI heeft tijdelijk geen ruimte voor deze aanvraag. Controleer limiet of tegoed en probeer het daarna opnieuw.";
  if (status >= 500) return "OpenAI is tijdelijk niet bereikbaar. Probeer het over een minuut opnieuw.";
  return "De AI-aanvraag werd niet geaccepteerd. Probeer het opnieuw; blijft dit zo, laat het ons weten.";
}
