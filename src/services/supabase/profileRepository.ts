import type { UserRole } from "../../types/app";
import type { YearLevel } from "../../types/common";
import type { Database } from "../../types/database.types";
import { supabase } from "./client";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export type ProfileRecord = {
  id: string; // Auth UUID
  studentId: string;
  name: string;
  role: UserRole;
  yearLevel: YearLevel;
  program: string;
  section: string;
  active: boolean;
  mustChangePassword: boolean;
  accountSetupCompleted: boolean;
};

const yearLevels: YearLevel[] = ["Freshman", "Sophomore", "Junior", "Senior"];

function asYearLevel(value: unknown): YearLevel {
  return yearLevels.find((year) => year.toLowerCase() === String(value ?? "").toLowerCase()) ?? "Freshman";
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
  };
}

export async function getProfileById(userId: string): Promise<{ data: ProfileRecord | null; error: string | null }> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, student_id, name, role, year_level, program, section, active, must_change_password, account_setup_completed, created_at, updated_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  if (!data) return { data: null, error: null };

  return { data: mapProfileRow(data), error: null };
}

export async function getProfiles(): Promise<{ data: ProfileRecord[] | null; error: string | null }> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, student_id, name, role, year_level, program, section, active, must_change_password, account_setup_completed, created_at, updated_at")
    .order("name", { ascending: true });

  if (error) return { data: null, error: error.message };

  return {
    data: (data || []).map(mapProfileRow),
    error: null,
  };
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
