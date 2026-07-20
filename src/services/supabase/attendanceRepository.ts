import { supabase } from "./client";
import type { AttendanceRecord } from "../../types/app";

// Retrieves all attendance records for an admin view or specific user
export async function getAttendance(studentId?: string): Promise<{ data: AttendanceRecord[] | null; error: any }> {
  let query = supabase.from("attendance").select("*");
  
  if (studentId) {
    query = query.eq("student_id", studentId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching attendance:", error);
    return { data: null, error };
  }

  const mappedData = data.map((row) => ({
    id: row.id,
    eventId: row.session_id,
    userId: row.student_id,
    status: row.status as "Pending" | "Approved" | "Rejected",
    createdAt: row.scanned_at,
    checkedInAt: row.scanned_at,
    method: "Code" as const, // Default fallback
    arrival: "On time" as const, // Default fallback
  }));

  return { data: mappedData, error: null };
}

// Submits a new attendance log
export async function submitAttendance(sessionId: string, studentId: string): Promise<{ data: any; error: any }> {
  const { data, error } = await supabase
    .from("attendance")
    .insert([{ session_id: sessionId, student_id: studentId, status: "Pending" }])
    .select()
    .single();

  return { data, error };
}

// Moderates an attendance log (Admin only)
export async function moderateAttendance(attendanceId: string, status: "Approved" | "Rejected"): Promise<{ error: any }> {
  const { error } = await supabase
    .from("attendance")
    .update({ status })
    .eq("id", attendanceId);

  return { error };
}
