import type { Preferences, UserRole } from "../../types/app";
import type { YearLevel } from "../../types/common";
import type { Database } from "../../types/database.types";
import { supabase } from "./client";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export type ProfileRecord = {
  id: string; // Auth UUID
  studentId: string;
  name: string;
  role: UserRole;
  yearLevel: YearLevel | null;
  program: string;
  section: string;
  active: boolean;
  mustChangePassword: boolean;
  accountSetupCompleted: boolean;
  passwordPromptDismissedAt?: string;
};

const yearLevels: YearLevel[] = ["Freshman", "Sophomore", "Junior", "Senior"];

function asYearLevel(value: unknown): YearLevel | null {
  return yearLevels.find((year) => year.toLowerCase() === String(value ?? "").toLowerCase()) ?? null;
}

function mapProfileRow(row: ProfileRow): ProfileRecord {
  return {
    id: row.id,
    studentId: String(row.student_id || "").toUpperCase(),
    name: row.name || "Student",
    role: (row.role as UserRole) || "student",
    yearLevel: asYearLevel(row.year_level),
    program: row.program || "BS Computer Science",
    section: row.section || "A",
    active: row.active !== false,
    mustChangePassword: Boolean(row.must_change_password),
    accountSetupCompleted: Boolean(row.account_setup_completed),
    passwordPromptDismissedAt: row.password_prompt_dismissed_at || undefined,
  };
}

export async function getProfileById(userId: string): Promise<{ data: ProfileRecord | null; error: string | null }> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, student_id, name, role, year_level, program, section, active, must_change_password, account_setup_completed, password_prompt_dismissed_at, created_at, updated_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  if (!data) return { data: null, error: null };

  return { data: mapProfileRow(data), error: null };
}

export async function getProfiles(): Promise<{ data: ProfileRecord[] | null; error: string | null }> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, student_id, name, role, year_level, program, section, active, must_change_password, account_setup_completed, password_prompt_dismissed_at, created_at, updated_at")
    .order("name", { ascending: true });

  if (error) return { data: null, error: error.message };

  return {
    data: (data || []).map(mapProfileRow),
    error: null,
  };
}

export async function getMyPreferences(): Promise<{ data: Preferences | null; error: string | null }> {
  const { data, error } = await supabase
    .from("user_preferences")
    .select("reduced_motion, high_contrast, compact_navigation, session_reminders, note_updates, leaderboard_updates")
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  if (!data) return { data: null, error: null };
  return {
    data: {
      reducedMotion: data.reduced_motion,
      highContrast: data.high_contrast,
      compactNavigation: data.compact_navigation,
      sessionReminders: data.session_reminders,
      noteUpdates: data.note_updates,
      leaderboardUpdates: data.leaderboard_updates,
    },
    error: null,
  };
}

export async function saveMyPreferences(preferences: Preferences): Promise<{ error: string | null }> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return { error: "Your session has expired. Sign in again." };

  const { error } = await supabase.from("user_preferences").upsert({
    user_id: userData.user.id,
    reduced_motion: preferences.reducedMotion,
    high_contrast: preferences.highContrast,
    compact_navigation: preferences.compactNavigation,
    session_reminders: preferences.sessionReminders,
    note_updates: preferences.noteUpdates,
    leaderboard_updates: preferences.leaderboardUpdates,
  });
  return { error: error?.message || null };
}

export async function updateMyProfile(
  patch: Partial<Pick<ProfileRecord, "name" | "section" | "program">>
): Promise<{ data: ProfileRecord | null; error: string | null }> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { data: null, error: "Not authenticated" };

  const { data, error } = await supabase
    .from("profiles")
    .update({
      name: patch.name,
      section: patch.section,
      program: patch.program,
    })
    .eq("id", userData.user.id)
    .select()
    .single();

  if (error) return { data: null, error: error.message };
  return { data: mapProfileRow(data), error: null };
}

export async function adminUpdateProfile(
  userId: string,
  patch: Partial<Pick<ProfileRecord, "name" | "section" | "program" | "yearLevel" | "active" | "role">>
): Promise<{ data: ProfileRecord | null; error: string | null }> {
  const updatePayload: Database["public"]["Tables"]["profiles"]["Update"] = {};
  if (patch.name !== undefined) updatePayload.name = patch.name;
  if (patch.section !== undefined) updatePayload.section = patch.section;
  if (patch.program !== undefined) updatePayload.program = patch.program;
  if (patch.yearLevel !== undefined) updatePayload.year_level = patch.yearLevel;
  if (patch.active !== undefined) updatePayload.active = patch.active;
  if (patch.role !== undefined) updatePayload.role = patch.role;

  const { data, error } = await supabase
    .from("profiles")
    .update(updatePayload)
    .eq("id", userId)
    .select()
    .single();

  if (error) return { data: null, error: error.message };
  return { data: mapProfileRow(data), error: null };
}
