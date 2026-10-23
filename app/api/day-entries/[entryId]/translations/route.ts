import { NextResponse } from "next/server";
import {
  BODY_MAX,
  LOCATION_MAX,
  TITLE_MAX,
  mergeTranslationPatch,
  normalizeEntryTranslations,
  sanitizeTranslationPatch,
  syncDutchIntoI18n,
} from "../../../../../lib/entry-i18n";
import { validUuid } from "../../../../../lib/journal";
import { createClient } from "../../../../../lib/supabase/server";

export const runtime = "nodejs";

/** Manual edit/save of EN/PT (and optional other non-nl) translation fields. */
export async function PATCH(request: Request, { params }: { params: Promise<{ entryId: string }> }) {
  try {
    const { entryId } = await params;
    if (!validUuid(entryId)) return NextResponse.json({ error: "Ongeldig verslag." }, { status: 400 });

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });

    const { data: existing, error } = await supabase
      .from("day_entries")
      .select("id,title,actual_location,body,title_i18n,body_i18n,actual_location_i18n")
      .eq("id", entryId)
      .single();
    if (error || !existing) return NextResponse.json({ error: "Verslag niet gevonden." }, { status: 404 });

    const payload = await request.json().catch(() => ({}));
    const patch = sanitizeTranslationPatch(payload);
    if (
      !Object.keys(patch.title_i18n).length
      && !Object.keys(patch.body_i18n).length
      && !Object.keys(patch.actual_location_i18n).length
    ) {
      return NextResponse.json({ error: "Geen geldige vertalingen." }, { status: 400 });
    }

    const base = normalizeEntryTranslations(existing);
    const merged = mergeTranslationPatch(base, patch);
    merged.title_i18n = syncDutchIntoI18n(merged.title_i18n, existing.title || "", TITLE_MAX);
    merged.body_i18n = syncDutchIntoI18n(merged.body_i18n, existing.body || "", BODY_MAX);
    merged.actual_location_i18n = syncDutchIntoI18n(
      merged.actual_location_i18n,
      existing.actual_location || "",
      LOCATION_MAX,
    );

    const { data: saved, error: saveError } = await supabase
      .from("day_entries")
      .update({
        title_i18n: merged.title_i18n,
        body_i18n: merged.body_i18n,
        actual_location_i18n: merged.actual_location_i18n,
      })
      .eq("id", entryId)
      .select("id,title,actual_location,body,title_i18n,body_i18n,actual_location_i18n,publication_status,updated_at")
      .single();

    if (saveError || !saved) {
      return NextResponse.json({ error: "Vertalingen konden niet worden opgeslagen." }, { status: 500 });
    }

    return NextResponse.json({ entry: saved, translations: merged });
  } catch {
    return NextResponse.json({ error: "Vertalingen konden niet worden opgeslagen." }, { status: 500 });
  }
}
