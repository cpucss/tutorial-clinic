import type { UserRole } from "../../types/app";
import type { YearLevel } from "../../types/common";
import { supabase } from "./client";

export type ProfileRecord = {
  id: string;
  studentId: string;
  name: string;
  role: UserRole;
  yearLevel: YearLevel;
};

const yearLevels: YearLevel[] = ["Freshman", "Sophomore", "Junior", "Senior"];

function asYearLevel(value: unknown): YearLevel {
  return yearLevels.find((year) => year.toLowerCase() === String(value ?? "").toLowerCase()) ?? "Freshman";
}

export async function getProfiles(): Promise<{ data: ProfileRecord[] | null; error: any }> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, student_id, name, role, year_level");

  if (error) return { data: null, error };

  return {
    data: data.map((row) => ({
      id: row.id,
      studentId: String(row.student_id).toUpperCase(),
      name: row.name,
      role: row.role as UserRole,
      yearLevel: asYearLevel(row.year_level),
    })),
    error: null,
  };
}
