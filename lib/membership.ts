import type { SupabaseClient } from "@supabase/supabase-js";

/** True when the signed-in user is a trip_members row for this trip. */
export async function isTripMember(supabase: SupabaseClient, tripId: string, userId: string) {
  const { data } = await supabase
    .from("trip_members")
    .select("trip_id")
    .eq("trip_id", tripId)
    .eq("user_id", userId)
    .maybeSingle();
  return Boolean(data);
}
