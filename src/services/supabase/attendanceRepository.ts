import { supabase } from "./client";
import type { AttendanceRecord } from "../../types/app";
import type { Database } from "../../types/database.types";

type AttendanceRow = Database["public"]["Tables"]["attendance"]["Row"];

function mapAttendanceRow(row: AttendanceRow): AttendanceRecord {
  return {
    id: row.id,
    eventId: row.session_id,
    userId: row.user_id,
    status: row.status,
    checkedInAt: row.checked_in_at || row.scanned_at || new Date().toISOString(),
    method: row.method,
    arrival: row.arrival,
    reviewedAt: row.reviewed_at ?? undefined,
    reviewedBy: row.reviewed_by ?? undefined,
    correctionNote: row.correction_note ?? undefined,
  };
}

// Retrieves attendance records for an admin view or specific user
export async function getAttendance(userId?: string): Promise<{ data: AttendanceRecord[] | null; error: string | null }> {
  let query = supabase.from("attendance").select("*").order("checked_in_at", { ascending: false });
  
  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching attendance:", error);
    return { data: null, error: error.message };
  }

  return {
    data: (data || []).map(mapAttendanceRow),
    error: null,
  };
}

// Student code check-in via server RPC
export async function checkInWithCode(
  sessionId: string,
  rawCode: string
): Promise<{ data: AttendanceRecord | null; error: string | null }> {
  const { data, error } = await supabase.rpc("check_in_with_code", {
    p_session_id: sessionId,
    p_code: rawCode.trim().toUpperCase(),
  });

  if (error) {
    return {
      data: null,
      error: error.message || "Failed to check in with code.",
    };
  }

  return {
    data: data ? mapAttendanceRow(data) : null,
    error: null,
  };
}

// Issues a cryptographic opaque single-use QR token for the student
export async function issueAttendanceQr(): Promise<{
  token: string | null;
  expiresAt: string | null;
  error: string | null;
}> {
  const { data, error } = await supabase.rpc("issue_attendance_qr");

  if (error) {
    return {
      token: null,
      expiresAt: null,
      error: error.message || "Failed to generate attendance QR.",
    };
  }

  return {
    token: data?.token || null,
    expiresAt: data?.expires_at || null,
    error: null,
  };
}

// Admin records student attendance by scanning the opaque QR token
export async function recordAttendanceFromQr(
  sessionId: string,
  qrToken: string
): Promise<{
  data: AttendanceRecord | null;
  studentName?: string;
  studentId?: string;
  error: string | null;
}> {
  const { data, error } = await supabase.rpc("record_attendance_from_qr", {
    p_session_id: sessionId,
    p_token: qrToken.trim(),
  });

  if (error) {
    return {
      data: null,
      error: error.message || "Failed to record QR attendance.",
    };
  }

  return {
    data: data?.attendance ? mapAttendanceRow(data.attendance) : null,
    studentName: data?.student?.name,
    studentId: data?.student?.student_id,
    error: null,
  };
}

// Moderates an attendance log (Admin only) via atomic RPC
export async function moderateAttendance(
  attendanceId: string,
  status: "Approved" | "Rejected",
  correctionNote?: string
): Promise<{ data: AttendanceRecord | null; error: string | null }> {
  const { data, error } = await supabase.rpc("moderate_attendance", {
    p_attendance_id: attendanceId,
    p_status: status,
    p_note: correctionNote || null,
  });

  if (error) {
    return {
      data: null,
      error: error.message || "Failed to moderate attendance.",
    };
  }

  return {
    data: data ? mapAttendanceRow(data) : null,
    error: null,
  };
}
