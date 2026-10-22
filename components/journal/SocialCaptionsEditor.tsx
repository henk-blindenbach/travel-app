"use client";

import { useEffect, useState } from "react";
import {
  SOCIAL_PLATFORMS,
  characterCount,
  hasAnyCaption,
  isOverLimit,
  joinCaptionParts,
  normalizeSocialCaptions,
  splitCaptionHashtags,
  type SocialCaptions,
  type SocialPlatformKey,
} from "../../lib/social-captions";

type Props = {
  entryId: string | null;
  captions: SocialCaptions;
  activeKey: SocialPlatformKey;
  onActiveKeyChange: (key: SocialPlatformKey) => void;
  onCaptionsChange: (captions: SocialCaptions) => void;
  onMessage: (message: string) => void;
};

export function SocialCaptionsEditor({
  entryId,
  captions,
  activeKey,
  onActiveKeyChange,
  onCaptionsChange,
  onMessage,
}: Props) {
  const normalized = normalizeSocialCaptions(captions);
  const [drafts, setDrafts] = useState<Record<SocialPlatformKey, { body: string; hashtags: string }>>(() =>
    buildDrafts(normalized),
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDrafts(buildDrafts(normalizeSocialCaptions(captions)));
  }, [captions]);

  const platform = SOCIAL_PLATFORMS.find((item) => item.key === activeKey)!;
  const draft = drafts[activeKey] || { body: "", hashtags: "" };
  const combined = joinCaptionParts(draft.body, draft.hashtags);
  const count = characterCount(combined);
  const over = isOverLimit(combined, activeKey);

  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      onMessage("Caption gekopieerd.");
    } catch {
      onMessage("Kopiëren lukte niet; selecteer de tekst handmatig.");
    }
  }

  async function save() {
    if (!entryId) {
      onMessage("Sla eerst het verslag op.");
      return;
    }
    if (over) {
      onMessage(`Caption is te lang voor ${platform.label} (max ${platform.limit}).`);
      return;
    }
    setSaving(true);
    try {
      const next: SocialCaptions = { ...normalized };
      for (const item of SOCIAL_PLATFORMS) {
        const parts = drafts[item.key] || { body: "", hashtags: "" };
        const text = joinCaptionParts(parts.body, parts.hashtags);
        if (text) next[item.key] = text;
        else delete next[item.key];
      }
      const response = await fetch(`/api/day-entries/${entryId}/social`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ captions: next }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Captions opslaan lukte niet.");
      onCaptionsChange(normalizeSocialCaptions(data.captions));
      onMessage("Captions opgeslagen.");
    } catch (error) {
      onMessage(error instanceof Error ? error.message : "Captions opslaan lukte niet.");
    } finally {
      setSaving(false);
    }
  }

  if (!hasAnyCaption(normalized) && !SOCIAL_PLATFORMS.some((item) => drafts[item.key]?.body || drafts[item.key]?.hashtags)) {
    return null;
  }

  return (
    <div className="social-captions-editor">
      <div className="social-platform-tabs" role="tablist" aria-label="Platformcaptions">
        {SOCIAL_PLATFORMS.map((item) => {
          const filled = Boolean(normalized[item.key]?.trim() || drafts[item.key]?.body);
          return (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={activeKey === item.key}
              className={activeKey === item.key ? "social-platform-tab active" : "social-platform-tab"}
              onClick={() => onActiveKeyChange(item.key)}
            >
              {item.label}
              {filled ? " ·" : ""}
            </button>
          );
        })}
      </div>

      <div className="social-caption social-caption-edit" role="tabpanel">
        <div className="social-caption-heading">
          <b>{platform.label}</b>
          <span className={over ? "caption-counter over" : "caption-counter"}>
            {count} / {platform.limit}
          </span>
        </div>
        <label className="social-caption-field">
          Caption
          <textarea
            value={draft.body}
            maxLength={platform.limit}
            rows={platform.key === "instagram_story" ? 3 : 5}
            onChange={(event) => {
              const body = event.target.value;
              setDrafts((current) => ({
                ...current,
                [activeKey]: { ...current[activeKey], body },
              }));
            }}
            placeholder={`Schrijf of bewerk de ${platform.label}-caption…`}
          />
        </label>
        {platform.wantsHashtags ? (
          <label className="social-caption-field">
            Hashtags
            <input
              value={draft.hashtags}
              maxLength={400}
              onChange={(event) => {
                const hashtags = event.target.value;
                setDrafts((current) => ({
                  ...current,
                  [activeKey]: { ...current[activeKey], hashtags },
                }));
              }}
              placeholder="#reis #onderweg"
            />
          </label>
        ) : (
          <p className="entry-helper">Geen hashtags voor dit platform.</p>
        )}
        {draft.hashtags.trim() || (platform.wantsHashtags && splitCaptionHashtags(normalized[activeKey] || "").hashtags.length) ? (
          <p className="social-hashtag-preview" aria-label="Hashtags">
            {(draft.hashtags.trim()
              ? draft.hashtags.trim().split(/[\s,]+/).filter(Boolean)
              : splitCaptionHashtags(normalized[activeKey] || "").hashtags
            ).map((tag) => (
              <span key={tag}>{tag.startsWith("#") ? tag : `#${tag}`}</span>
            ))}
          </p>
        ) : null}
        <div className="social-caption-actions">
          <button className="text-button" type="button" onClick={() => void copy(combined)} disabled={!combined.trim()}>
            Kopieer caption
          </button>
          <a className="text-button" href={platform.url} target="_blank" rel="noreferrer">
            Open {platform.label} ↗
          </a>
          <button className="secondary-button" type="button" onClick={() => void save()} disabled={saving || !entryId}>
            {saving ? "Opslaan…" : "Captions opslaan"}
          </button>
        </div>
      </div>
    </div>
  );
}

function buildDrafts(captions: SocialCaptions) {
  const drafts = {} as Record<SocialPlatformKey, { body: string; hashtags: string }>;
  for (const platform of SOCIAL_PLATFORMS) {
    const split = splitCaptionHashtags(captions[platform.key] || "");
    drafts[platform.key] = {
      body: split.body,
      hashtags: split.hashtags.join(" "),
    };
  }
  return drafts;
}
