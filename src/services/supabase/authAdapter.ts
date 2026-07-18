// Auth adapter — handles student login via Supabase Auth.
// Students only type their ID; the email conversion is invisible to them.

import { supabase } from "./client";

// Converts a student ID to the internal email format for Supabase Auth
function toAuthEmail(studentId: string): string {
  return `${studentId}@cpucss.edu.ph`;
}

// Normalizes raw input — accepts "24123456" and returns "24-1234-56"
export function normalizeStudentId(raw: string): string {
  const trimmed = raw.trim();
  if (/^\d{8}$/.test(trimmed)) {
    return `${trimmed.slice(0, 2)}-${trimmed.slice(2, 6)}-${trimmed.slice(6, 8)}`;
  }
  return trimmed.toUpperCase();
}

// Validates the CPU student ID format (YY-XXXX-ZZ)
export function isValidStudentId(studentId: string): boolean {
  return /^\d{2}-\d{4}-\d{2}$/.test(studentId);
}

// Default password is the student ID without dashes
export function getDefaultPassword(studentId: string): string {
  return studentId.replace(/-/g, "");
}

// Signs in a student using their ID and password
export async function signInStudent(rawStudentId: string, password: string) {
  const studentId = normalizeStudentId(rawStudentId);

  if (!isValidStudentId(studentId) && studentId !== "ADMIN-001") {
    return { data: null, error: "Invalid ID format. Use YY-XXXX-ZZ (e.g. 24-1234-56)." };
  }

  const email = toAuthEmail(studentId);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { data: null, error: "Incorrect ID or password. Please try again." };
  }

  return { data, error: null };
}

// Updates the current user's password (used for forced password change on first login)
export async function updatePassword(newPassword: string) {
  if (newPassword.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) {
    return { error: "Failed to update password. Please try again." };
  }

  return { error: null };
}

// Signs out the current user and clears the local session
export async function signOut() {
  await supabase.auth.signOut();
}

// Returns the current session, or null if not logged in
export async function getCurrentSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

// Checks if the user is still using their default password
export function isDefaultPassword(studentId: string, password: string): boolean {
  return password === getDefaultPassword(studentId);
}
