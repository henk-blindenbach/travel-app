/** Platform captions for social handoff (Instagram variants + Facebook + Polarsteps). */

export const SOCIAL_PLATFORM_KEYS = [
  "instagram_feed",
  "instagram_carousel",
  "instagram_story",
  "facebook",
  "polarsteps",
] as const;

export type SocialPlatformKey = (typeof SOCIAL_PLATFORM_KEYS)[number];

export type SocialCaptions = Partial<Record<SocialPlatformKey, string>>;

export type SocialPlatformMeta = {
  key: SocialPlatformKey;
  label: string;
  url: string;
  limit: number;
  wantsHashtags: boolean;
};

export const SOCIAL_PLATFORMS: SocialPlatformMeta[] = [
  {
    key: "instagram_feed",
    label: "Instagram feed",
    url: "https://www.instagram.com/",
    limit: 2_200,
    wantsHashtags: true,
  },
  {
    key: "instagram_carousel",
    label: "Instagram carousel",
    url: "https://www.instagram.com/",
    limit: 2_200,
    wantsHashtags: true,
  },
  {
    key: "instagram_story",
    label: "Instagram story",
    url: "https://www.instagram.com/",
    limit: 200,
    wantsHashtags: false,
  },
  {
    key: "facebook",
    label: "Facebook",
    url: "https://www.facebook.com/",
    limit: 5_000,
    wantsHashtags: false,
  },
  {
    key: "polarsteps",
    label: "Polarsteps",
    url: "https://www.polarsteps.com/",
    limit: 1_000,
    wantsHashtags: false,
  },
];

const HASHTAG_RE = /(?:^|\s)(#[\p{L}\p{N}_]+)/gu;

/** Split caption body and trailing/inline hashtags for separate display. */
export function splitCaptionHashtags(caption: string) {
  const text = typeof caption === "string" ? caption.trim() : "";
  if (!text) return { body: "", hashtags: [] as string[] };
  const found: string[] = [];
  const without = text.replace(HASHTAG_RE, (_match, tag: string) => {
    const normalized = tag.toLowerCase();
    if (!found.includes(normalized)) found.push(normalized);
    return " ";
  });
  return { body: without.replace(/\s+/g, " ").trim(), hashtags: found };
}

/** Join edited body + hashtags into one caption string for copy/share/save. */
export function joinCaptionParts(body: string, hashtags: string[] | string) {
  const cleanBody = (body || "").trim();
  const tags = (Array.isArray(hashtags) ? hashtags : String(hashtags || "").split(/[\s,]+/))
    .map((tag) => tag.trim())
    .filter(Boolean)
    .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`));
  const unique: string[] = [];
  for (const tag of tags) {
    const lower = tag.toLowerCase();
    if (!unique.some((existing) => existing.toLowerCase() === lower)) unique.push(tag);
  }
  if (!cleanBody) return unique.join(" ");
  if (!unique.length) return cleanBody;
  return `${cleanBody}\n\n${unique.join(" ")}`;
}

export function platformMeta(key: SocialPlatformKey) {
  return SOCIAL_PLATFORMS.find((platform) => platform.key === key)!;
}

export function characterCount(caption: string) {
  return (caption || "").length;
}

export function isOverLimit(caption: string, key: SocialPlatformKey) {
  return characterCount(caption) > platformMeta(key).limit;
}

/** Map legacy `instagram` key and unknown shapes into the current platform keys. */
export function normalizeSocialCaptions(raw: unknown): SocialCaptions {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const source = raw as Record<string, unknown>;
  const out: SocialCaptions = {};
  for (const key of SOCIAL_PLATFORM_KEYS) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) out[key] = value.trim();
  }
  if (!out.instagram_feed && typeof source.instagram === "string" && source.instagram.trim()) {
    out.instagram_feed = source.instagram.trim();
  }
  return out;
}

export function sanitizeSocialCaptions(raw: unknown): SocialCaptions {
  const normalized = normalizeSocialCaptions(raw);
  const out: SocialCaptions = {};
  for (const platform of SOCIAL_PLATFORMS) {
    const value = normalized[platform.key];
    if (!value) continue;
    out[platform.key] = value.slice(0, platform.limit);
  }
  return out;
}

export function hasAnyCaption(captions: SocialCaptions | null | undefined) {
  if (!captions) return false;
  return SOCIAL_PLATFORM_KEYS.some((key) => Boolean(captions[key]?.trim()));
}

/** Prefer feed, then first non-empty caption, for share sheet text. */
export function preferredShareCaption(captions: SocialCaptions | null | undefined) {
  const normalized = normalizeSocialCaptions(captions || {});
  if (normalized.instagram_feed?.trim()) return normalized.instagram_feed.trim();
  for (const key of SOCIAL_PLATFORM_KEYS) {
    const value = normalized[key]?.trim();
    if (value) return value;
  }
  return "";
}

export function selectedPublicPhotos<T extends { is_public?: boolean; upload_status?: string }>(
  assets: T[],
) {
  return assets.filter((asset) => asset.is_public && asset.upload_status === "ready");
}

export function sharePhotosDisabledHint(selectedCount: number) {
  if (selectedCount > 0) return "";
  return "Selecteer eerst minstens één foto met «Gebruik voor publicatie en social».";
}

/** OpenAI JSON schema for generating all platform captions. */
export function socialCaptionsJsonSchema() {
  const properties: Record<string, { type: "string" }> = {};
  for (const key of SOCIAL_PLATFORM_KEYS) properties[key] = { type: "string" };
  return {
    type: "object",
    additionalProperties: false,
    properties,
    required: [...SOCIAL_PLATFORM_KEYS],
  };
}

export function socialCaptionsPrompt(facts: {
  title: string;
  location: string;
  body: string;
  photoCaptions: unknown;
}) {
  return [
    "Schrijf Nederlandse social-captions voor Henk en Michel.",
    "Michel is mannelijk en heet nooit Michelle.",
    "Gebruik alleen deze feiten, schrijf in wij-vorm en verzin niets.",
    "instagram_feed: warm, compact, max ±2200 tekens, passende hashtags aan het eind.",
    "instagram_carousel: iets meer nadruk op de reeks beelden, compact, hashtags aan het eind.",
    "instagram_story: heel kort (max ±200 tekens), geen hashtags, geschikt als story-tekst.",
    "facebook: iets uitgebreider, zonder hashtags.",
    "polarsteps: feitelijk reislog, compact, zonder hashtags.",
    `Titel: ${facts.title}.`,
    `Locatie: ${facts.location}.`,
    `Verhaal: ${facts.body}.`,
    `Fotobijschriften: ${JSON.stringify(facts.photoCaptions)}`,
  ].join(" ");
}
