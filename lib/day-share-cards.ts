/**
 * Server-side JPEG day cards for the journal share/download batch.
 * Trip-generic: only day number + start/eind — no destination-specific copy.
 *
 * Text is converted to SVG paths with bundled Tinos/Arimo fonts so Vercel/sharp
 * does not depend on system fonts (which produced black blank cards in prod).
 */

import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import type { Font } from "opentype.js";
import sharp from "sharp";

/** CJS-safe load: Node tests and Turbopack disagree on opentype named/default exports. */
const require = createRequire(import.meta.url);
const parseOpenType = (require("opentype.js") as { parse: (buf: ArrayBuffer) => Font }).parse;

export type DayShareCardSlot = "start" | "eind";

/** Instagram-friendly 4:5 portrait, matches typical social photo export. */
export const DAY_SHARE_CARD_WIDTH = 1080;
export const DAY_SHARE_CARD_HEIGHT = 1350;

const FONT_DIR = path.join(process.cwd(), "public", "fonts", "day-share");

let serifFont: Font | null = null;
let sansFont: Font | null = null;

function loadFont(filename: string): Font {
  const buffer = readFileSync(path.join(FONT_DIR, filename));
  return parseOpenType(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));
}

function getSerifFont(): Font {
  if (!serifFont) serifFont = loadFont("Tinos-Bold.ttf");
  return serifFont;
}

function getSansFont(): Font {
  if (!sansFont) sansFont = loadFont("Arimo-Bold.ttf");
  return sansFont;
}

export function parseDayShareCardSlot(value: unknown): DayShareCardSlot | null {
  if (value === "start" || value === "eind") return value;
  return null;
}

export function dayShareCardFilename(dayNumber: number, slot: DayShareCardSlot): string {
  const n = Math.max(1, Math.floor(Number(dayNumber)) || 1);
  return `Dag-${n}-${slot}.jpg`;
}

export function dayShareCardLabel(dayNumber: number, slot: DayShareCardSlot): string {
  const n = Math.max(1, Math.floor(Number(dayNumber)) || 1);
  return slot === "start" ? `Dag ${n} start` : `Dag ${n} eind`;
}

/** Centered SVG path for a string (no system fonts required at render time). */
export function centeredTextPath(
  font: Font,
  text: string,
  centerX: number,
  baselineY: number,
  fontSize: number,
): string {
  const width = font.getAdvanceWidth(text, fontSize);
  const glyphPath = font.getPath(text, centerX - width / 2, baselineY, fontSize);
  return glyphPath.toPathData(2);
}

/**
 * Build an SVG day card: solid ink background + path-outlined labels.
 * Avoids CSS gradients and <text> so sharp/librsvg cannot drop content on Vercel.
 */
export function dayShareCardSvg(dayNumber: number, slot: DayShareCardSlot): string {
  const label = dayShareCardLabel(dayNumber, slot);
  const sub = slot === "start" ? "START" : "EIND";
  const w = DAY_SHARE_CARD_WIDTH;
  const h = DAY_SHARE_CARD_HEIGHT;
  const accent = slot === "start" ? "#1769e8" : "#2f7a45";
  const labelPath = centeredTextPath(getSerifFont(), label, w / 2, Math.round(h * 0.52), 88);
  const subPath = centeredTextPath(getSansFont(), sub, w / 2, Math.round(h * 0.60), 30);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="#0c263a"/>
  <rect width="${w}" height="${Math.round(h * 0.55)}" fill="#1f4050"/>
  <rect y="${Math.round(h * 0.45)}" width="${w}" height="${Math.round(h * 0.55)}" fill="#416e89" opacity="0.55"/>
  <circle cx="${w / 2}" cy="${Math.round(h * 0.34)}" r="${Math.round(w * 0.28)}" fill="#c2e2f5" opacity="0.18"/>
  <rect x="72" y="72" width="${w - 144}" height="${h - 144}" fill="none" stroke="#f7fafc" stroke-opacity="0.22" stroke-width="2"/>
  <circle cx="${w / 2}" cy="${Math.round(h * 0.38)}" r="8" fill="${accent}"/>
  <path d="${labelPath}" fill="#f7fafc"/>
  <path d="${subPath}" fill="#f7fafc" fill-opacity="0.78"/>
</svg>`;
}

/** Render a day share card as JPEG (quality suited for camera roll / social). */
export async function renderDayShareCardJpeg(
  dayNumber: number,
  slot: DayShareCardSlot,
): Promise<Buffer> {
  const svg = Buffer.from(dayShareCardSvg(dayNumber, slot));
  return sharp(svg)
    .jpeg({ quality: 90, mozjpeg: true })
    .toBuffer();
}
