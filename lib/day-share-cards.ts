/**
 * Server-side JPEG day cards for the journal share/download batch.
 * Trip-generic: only day number + start/eind — no destination-specific copy.
 */

import sharp from "sharp";

export type DayShareCardSlot = "start" | "eind";

/** Instagram-friendly 4:5 portrait, matches typical social photo export. */
export const DAY_SHARE_CARD_WIDTH = 1080;
export const DAY_SHARE_CARD_HEIGHT = 1350;

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

/** Escape text for embedding in SVG. */
function svgEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Build an SVG day card: soft sky→ink gradient, centered label.
 * Uses system serif/sans so sharp does not need bundled webfonts.
 */
export function dayShareCardSvg(dayNumber: number, slot: DayShareCardSlot): string {
  const label = svgEscape(dayShareCardLabel(dayNumber, slot));
  const w = DAY_SHARE_CARD_WIDTH;
  const h = DAY_SHARE_CARD_HEIGHT;
  const accent = slot === "start" ? "#1769e8" : "#2f7a45";
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0c263a"/>
      <stop offset="45%" stop-color="#1f4050"/>
      <stop offset="100%" stop-color="#416e89"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="38%" r="55%">
      <stop offset="0%" stop-color="#c2e2f5" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#c2e2f5" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  <rect width="${w}" height="${h}" fill="url(#glow)"/>
  <rect x="72" y="72" width="${w - 144}" height="${h - 144}" fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="2"/>
  <circle cx="${w / 2}" cy="${Math.round(h * 0.38)}" r="8" fill="${accent}"/>
  <text x="${w / 2}" y="${Math.round(h * 0.52)}" text-anchor="middle" fill="#f7fafc"
    font-family="Georgia, 'Times New Roman', serif" font-size="92" font-weight="700"
    letter-spacing="-2">${label}</text>
  <text x="${w / 2}" y="${Math.round(h * 0.60)}" text-anchor="middle" fill="rgba(247,250,252,0.72)"
    font-family="'Helvetica Neue', Helvetica, Arial, sans-serif" font-size="28" font-weight="600"
    letter-spacing="4">${slot === "start" ? "START" : "EIND"}</text>
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
