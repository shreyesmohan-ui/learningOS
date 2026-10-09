import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Attempt } from "./study";
export type StudyCondition = "coached" | "answer_first";
export type CloudConfig = { supabaseUrl: string | null; supabaseKey: string | null; liveTutor: boolean; datasetId: string };
export function cloudClient(config: CloudConfig): SupabaseClient | null {
  if (!config.supabaseUrl || !config.supabaseKey) return null;
  return createClient(config.supabaseUrl, config.supabaseKey, { auth: { storageKey: "learning-os-auth-v1", persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
}
export async function saveCloudAttempt(client: SupabaseClient, attempt: Attempt, condition: StudyCondition, datasetId: string) {
  const { data, error: authError } = await client.auth.getUser();
  if (authError || !data.user) throw new Error("Sign in to save cloud records.");
  const userId = data.user.id;
  const { error: sessionError } = await client.from("learning_os_sessions").upsert({
    id: attempt.session, user_id: userId, participant_code: attempt.participant, condition,
    dataset_id: datasetId, is_demo: attempt.participant === "demo",
  }, { onConflict: "id", ignoreDuplicates: true });
  if (sessionError) throw new Error("Cloud session could not be saved. Your record remains on this device.");
  const { error } = await client.from("learning_os_attempts").upsert({
    id: attempt.id, session_id: attempt.session, user_id: userId, exercise_id: attempt.exerciseId,
    phase: attempt.phase, payload: attempt,
  }, { onConflict: "id", ignoreDuplicates: true });
  if (error) throw new Error("Cloud attempt could not be saved. Your record remains on this device.");
}
