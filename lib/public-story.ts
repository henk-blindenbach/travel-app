export type PublicStoryBlock = { type: "heading" | "paragraph"; text: string };

/**
 * Split a published day body into reading blocks.
 * Supports `## Heading` on its own line; body lines after a heading stay paragraphs
 * even when only a single newline separates them (common in AI drafts).
 */
export function parsePublicStoryBlocks(body: string): PublicStoryBlock[] {
  const blocks: PublicStoryBlock[] = [];
  const chunks = body.replace(/\r\n/g, "\n").split(/\n{2,}/);

  for (const chunk of chunks) {
    const lines = chunk.split("\n").map((line) => line.trimEnd());
    if (!lines.some((line) => line.trim())) continue;

    let paragraphLines: string[] = [];

    const flushParagraph = () => {
      const text = paragraphLines.join("\n").trim();
      paragraphLines = [];
      if (text) blocks.push({ type: "paragraph", text });
    };

    for (const line of lines) {
      const heading = line.match(/^##\s+(.+)$/);
      if (heading) {
        flushParagraph();
        blocks.push({ type: "heading", text: heading[1].trim() });
        continue;
      }
      if (line.trim()) paragraphLines.push(line.trim());
    }
    flushParagraph();
  }

  return blocks;
}
