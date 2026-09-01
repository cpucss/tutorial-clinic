// Auth adapter — handles student & admin login via Supabase Auth.
// Students type their student ID; the email conversion is handled internally.
// Admin roles are strictly resolved from the protected database profile, NEVER from the ID suffix.

import { supabase } from "./client";
import type { UserRole } from "../../types/app";
import type { YearLevel } from "../../types/common";

export type AuthProfile = {
  id: string; // Auth UUID
  studentId: string;
  name: string;
  role: UserRole;
  yearLevel: YearLevel | null;
  program: string;
  section: string;
  active: boolean;
  mustChangePassword?: boolean;
  accountSetupCompleted?: boolean;
  passwordPromptDismissedAt?: string;
};

export type AuthAccount = {
  user: {
    id: string; // Auth UUID
    email: string;
  };
  profile: AuthProfile;
};

// Converts a student ID to the internal email format for Supabase Auth
export function toAuthEmail(studentId: string): string {
  const normalized = studentId.trim().toLowerCase();
  return `${normalized}@cpucss.edu.ph`;
}

// Normalizes raw input — accepts "24123456" and returns "24-1234-56"
export function normalizeStudentId(raw: string): string {
  const trimmed = raw.trim();
  if (/^\d{8}$/.test(trimmed)) {
    return `${trimmed.slice(0, 2)}-${trimmed.slice(2, 6)}-${trimmed.slice(6, 8)}`;
  }
  return trimmed.toUpperCase();
}

// Validates the CPU student ID format (YY-XXXX-ZZ or YYYY-00000)
export function isValidStudentId(studentId: string): boolean {
  return /^\d{2}-\d{4}-\d{2}$/.test(studentId) || /^\d{4}-\d{5}$/.test(studentId) || /^\d{2}-\d{4}-\d{2}-ADMIN$/i.test(studentId);
}

export function isValidAdminId(studentId: string): boolean {
  return /^\d{2}-\d{4}-\d{2}-ADMIN$/i.test(studentId);
}

// Default password fallback check
export function getDefaultPassword(studentId: string): string {
  return studentId.replace(/-/g, "");
}

export function isDefaultPassword(studentId: string, password: string): boolean {
  return password === getDefaultPassword(studentId);
}

// Signs in a student with their student ID and password
export async function signInStudent(
  studentId: string,
  password?: string
): Promise<{ account: AuthAccount | null; error: string | null }> {
  const email = toAuthEmail(studentId);
  const pass = password || getDefaultPassword(studentId);

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: pass,
  });

  if (error) {
    return { account: null, error: error.message };
  }

  if (!data.user) {
    return { account: null, error: "No user returned from Supabase Auth." };
  }

  // Fetch the protected profile
  const { data: profileRow, error: profileError } = await supabase
    .from("profiles")
    .select("id, student_id, name, role, year_level, program, section, active, must_change_password, account_setup_completed, password_prompt_dismissed_at")
    .eq("id", data.user.id)
    .single();

  if (profileError || !profileRow) {
    return {
      account: null,
      error: "Could not fetch user profile from the database.",
    };
  }

  if (!profileRow.active) {
    await supabase.auth.signOut();
    return {
      account: null,
      error: "This student account has been deactivated. Please contact an administrator.",
    };
  }

  const account: AuthAccount = {
    user: {
      id: data.user.id,
      email: data.user.email || email,
    },
    profile: {
      id: profileRow.id,
      studentId: String(profileRow.student_id || "").toUpperCase(),
      name: profileRow.name || "Student",
      role: (profileRow.role as UserRole) || "student",
      yearLevel: (profileRow.year_level as YearLevel) ?? null,
      program: profileRow.program || "BS Computer Science",
      section: profileRow.section || "A",
      active: profileRow.active,
      mustChangePassword: Boolean(profileRow.must_change_password),
      accountSetupCompleted: Boolean(profileRow.account_setup_completed),
      passwordPromptDismissedAt: profileRow.password_prompt_dismissed_at || undefined,
    },
  };

  return { account, error: null };
}

// Restores existing session and profile on page reload
export async function restoreAccount(): Promise<AuthAccount | null> {
  const { data } = await supabase.auth.getSession();
  if (!data.session?.user) return null;

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("id, student_id, name, role, year_level, program, section, active, must_change_password, account_setup_completed, password_prompt_dismissed_at")
    .eq("id", data.session.user.id)
    .single();

  if (!profileRow || !profileRow.active) return null;

  return {
    user: {
      id: data.session.user.id,
      email: data.session.user.email || "",
    },
    profile: {
      id: profileRow.id,
      studentId: String(profileRow.student_id || "").toUpperCase(),
      name: profileRow.name || "Student",
      role: (profileRow.role as UserRole) || "student",
      yearLevel: (profileRow.year_level as YearLevel) ?? null,
      program: profileRow.program || "BS Computer Science",
      section: profileRow.section || "A",
      active: true,
      mustChangePassword: Boolean(profileRow.must_change_password),
      accountSetupCompleted: Boolean(profileRow.account_setup_completed),
      passwordPromptDismissedAt: profileRow.password_prompt_dismissed_at || undefined,
    },
  };
}

// Subscribes to Supabase Auth state changes
export function subscribeToAuth(callback: (account: AuthAccount | null) => void): () => void {
  const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, session) => {
    if (session?.user) {
      const account = await restoreAccount();
      callback(account);
    } else {
      callback(null);
    }
  });

  return () => {
    subscription.subscription.unsubscribe();
  };
}

// Updates the user password
export async function updatePassword(newPassword: string): Promise<{ error: string | null }> {
  if (newPassword.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session) {
      return { error: "Your session has expired. Sign in again before changing your password." };
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      return { error: error.message || "Failed to update password." };
    }

    const { error: profileError } = await supabase.rpc("complete_password_change");
    if (profileError) {
      return {
        error: "Your password changed, but the account reminder could not be completed. Refresh and try again.",
      };
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to update password.",
    };
  }

  return { error: null };
}

export async function deferPasswordChange(): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase.rpc("defer_password_change");
    return { error: error?.message || null };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not save your reminder preference.",
    };
  }
}

// Signs out the user
export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

// Returns the current session
export async function getCurrentSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}
