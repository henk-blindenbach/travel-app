import type { SupabaseClient } from "@supabase/supabase-js";

export function isoDate(value: unknown) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "";
}

export function datesInRange(startsOn: string, endsOn: string) {
  const dates: string[] = [];
  const cursor = new Date(`${startsOn}T12:00:00Z`);
  const end = new Date(`${endsOn}T12:00:00Z`);
  while (cursor <= end) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

function tempDate(index: number) {
  const base = new Date(Date.UTC(2099, 0, 1 + index));
  return base.toISOString().slice(0, 10);
}

function dayLooksFilled(day: {
  title: string | null;
  planned_location: string | null;
  planned_route: string | null;
  private_notes?: string | null;
  planned_latitude?: number | null;
  planned_longitude?: number | null;
}) {
  return Boolean(
    day.title?.trim() ||
      day.planned_location?.trim() ||
      day.planned_route?.trim() ||
      day.private_notes?.trim() ||
      day.planned_latitude != null ||
      day.planned_longitude != null,
  );
}

/** Remap trip_days to a new inclusive date range. Keeps day order/content; blocks shortening over non-empty days. */
export async function syncTripDaysForDateChange(
  supabase: SupabaseClient,
  tripId: string,
  startsOn: string,
  endsOn: string,
): Promise<{ ok: true; dayCount: number } | { ok: false; error: string }> {
  const targetDates = datesInRange(startsOn, endsOn);
  if (!targetDates.length) return { ok: false, error: "Ongeldige datums." };
  if (targetDates.length > 400) return { ok: false, error: "Een reis kan maximaal 400 dagen beslaan." };

  let existing: Array<{
    id: string;
    day_number: number;
    day_date: string;
    title: string | null;
    planned_location: string | null;
    planned_route: string | null;
    private_notes: string | null;
    planned_latitude: number | null;
    planned_longitude: number | null;
  }> = [];

  const withCoords = await supabase
    .from("trip_days")
    .select("id,day_number,day_date,title,planned_location,planned_route,private_notes,planned_latitude,planned_longitude")
    .eq("trip_id", tripId)
    .order("day_number");
  if (withCoords.error) {
    const fallback = await supabase
      .from("trip_days")
      .select("id,day_number,day_date,title,planned_location,planned_route,private_notes")
      .eq("trip_id", tripId)
      .order("day_number");
    if (fallback.error) return { ok: false, error: "Reisdagen konden niet worden gelezen." };
    existing = (fallback.data || []).map((day) => ({ ...day, planned_latitude: null, planned_longitude: null }));
  } else {
    existing = withCoords.data || [];
  }

  const keep = existing.slice(0, targetDates.length);
  const remove = existing.slice(targetDates.length);

  if (remove.length) {
    for (const day of remove) {
      if (dayLooksFilled(day)) {
        return {
          ok: false,
          error: `Dag ${day.day_number} heeft nog inhoud. Verwijder of verplaats die gegevens eerst voordat je de reis inkort.`,
        };
      }
    }
    const removeIds = remove.map((day) => day.id);
    const [{ count: entries }, { count: interviews }, { count: planning }, { count: docs }] = await Promise.all([
      supabase.from("day_entries").select("id", { count: "exact", head: true }).in("trip_day_id", removeIds),
      supabase.from("day_interviews").select("id", { count: "exact", head: true }).in("trip_day_id", removeIds),
      supabase.from("planning_items").select("id", { count: "exact", head: true }).in("trip_day_id", removeIds),
      supabase.from("trip_documents").select("id", { count: "exact", head: true }).in("trip_day_id", removeIds),
    ]);
    if ((entries || 0) + (interviews || 0) + (planning || 0) + (docs || 0) > 0) {
      return {
        ok: false,
        error: "Sommige dagen die zouden verdwijnen hebben nog verslagen, planning of documenten. Ruim die eerst op of kies een langere periode.",
      };
    }
    const { error: deleteError } = await supabase.from("trip_days").delete().in("id", removeIds);
    if (deleteError) return { ok: false, error: "Lege dagen aan het eind konden niet worden verwijderd." };
  }

  for (let index = 0; index < keep.length; index += 1) {
    const { error } = await supabase
      .from("trip_days")
      .update({ day_number: 100000 + index + 1, day_date: tempDate(index) })
      .eq("id", keep[index].id)
      .eq("trip_id", tripId);
    if (error) return { ok: false, error: "Reisdagen konden niet worden herschikt." };
  }

  for (let index = 0; index < keep.length; index += 1) {
    const dayNumber = index + 1;
    const dayDate = targetDates[index];
    const { error } = await supabase
      .from("trip_days")
      .update({ day_number: dayNumber, day_date: dayDate })
      .eq("id", keep[index].id)
      .eq("trip_id", tripId);
    if (error) return { ok: false, error: "Reisdagen konden niet worden bijgewerkt." };
    await supabase.from("day_entries").update({ day_number: dayNumber, day_date: dayDate }).eq("trip_day_id", keep[index].id);
  }

  if (targetDates.length > keep.length) {
    const inserts = targetDates.slice(keep.length).map((dayDate, offset) => ({
      trip_id: tripId,
      day_number: keep.length + offset + 1,
      day_date: dayDate,
    }));
    const { error } = await supabase.from("trip_days").insert(inserts);
    if (error) return { ok: false, error: "Nieuwe reisdagen konden niet worden toegevoegd." };
  }

  return { ok: true, dayCount: targetDates.length };
}
