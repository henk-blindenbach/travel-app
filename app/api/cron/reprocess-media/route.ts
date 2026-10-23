import { NextResponse } from "next/server";
import { validUuid } from "../../../../lib/journal";
import { processMediaWebVersion } from "../../../../lib/media-web-process";
import { authorizeCronRequest } from "../../../../lib/reminders";
import { createServiceClient, hasServiceRoleEnv } from "../../../../lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * One-shot / ops helper: regenerate WebP for failed (or ready-without-web) media via Production Scaleway keys.
 * Auth: same CRON_SECRET as daily-reminder. Never deletes originals.
 *
 * Query:
 * - tripId (optional uuid): limit to one trip
 * - limit (optional, default 20, max 50)
 * - dryRun=1: list only
 */
async function handle(request: Request) {
  const auth = authorizeCronRequest(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (!hasServiceRoleEnv()) {
    return NextResponse.json({ error: "Supabase service role ontbreekt." }, { status: 503 });
  }

  const url = new URL(request.url);
  const dryRun = url.searchParams.get("dryRun") === "1" || url.searchParams.get("dry-run") === "1";
  const tripId = url.searchParams.get("tripId") || "";
  if (tripId && !validUuid(tripId)) {
    return NextResponse.json({ error: "Ongeldige tripId." }, { status: 400 });
  }
  const limitRaw = Number(url.searchParams.get("limit") || "20");
  const limit = Number.isFinite(limitRaw) ? Math.min(50, Math.max(1, Math.floor(limitRaw))) : 20;

  const supabase = createServiceClient();

  let entryIds: string[] | null = null;
  if (tripId) {
    const { data: days, error: daysError } = await supabase
      .from("trip_days")
      .select("id,day_entries(id)")
      .eq("trip_id", tripId);
    if (daysError) return NextResponse.json({ error: daysError.message }, { status: 500 });
    entryIds = (days || []).flatMap((day) => {
      const entries = day.day_entries as { id: string } | { id: string }[] | null;
      if (!entries) return [];
      return Array.isArray(entries) ? entries.map((e) => e.id) : [entries.id];
    });
    if (!entryIds.length) {
      return NextResponse.json({ processed: 0, ready: 0, failed: 0, results: [], note: "Geen day_entries voor deze trip." });
    }
  }

  let query = supabase
    .from("media_assets")
    .select("id,original_object_key,web_object_path,upload_status,original_filename,day_entry_id")
    .eq("upload_status", "failed")
    .order("updated_at", { ascending: true })
    .limit(limit);
  if (entryIds) query = query.in("day_entry_id", entryIds);

  const { data: assets, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const targets = (assets || []).map((asset) => ({
    id: asset.id,
    original_object_key: asset.original_object_key,
    web_object_path: asset.web_object_path,
    original_filename: asset.original_filename,
    upload_status: asset.upload_status,
  }));

  if (dryRun) {
    return NextResponse.json({ dryRun: true, count: targets.length, assets: targets.map((a) => ({ id: a.id, file: a.original_filename })) });
  }

  const results: { id: string; file: string; ok: boolean; error?: string; code?: string }[] = [];
  for (const asset of targets) {
    const result = await processMediaWebVersion(supabase, supabase, asset);
    results.push({
      id: asset.id,
      file: asset.original_filename,
      ok: result.ok,
      error: result.ok ? undefined : result.error,
      code: result.ok ? undefined : result.code,
    });
  }

  return NextResponse.json({
    processed: results.length,
    ready: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    results,
  });
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
