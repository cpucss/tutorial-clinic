import { supabase } from "./client";
import type { DemoEvent, Rsvp } from "../../types/app";

// Retrieves all sessions from the database, ordered by start date
export async function getSessions(): Promise<{ data: DemoEvent[] | null; error: any }> {
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .order("date", { ascending: true });

  if (error) {
    console.error("Error fetching sessions:", error);
    return { data: null, error };
  }

  // Map database column names to application types
  const mappedData = data.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    subjectId: row.subject_id,
    date: row.date,
    endDate: row.end_date,
    venue: row.venue,
    capacity: row.capacity,
    instructor: row.instructor,
    attendanceCode: row.attendance_code,
    createdAt: row.created_at,
    topics: [], // Not supported in minimal schema yet
    yearLevels: [], // Not supported in minimal schema yet
    instructorRole: "TBD", // Not supported in minimal schema yet
    status: "Upcoming" as const, // Computed later
  }));

  return { data: mappedData, error: null };
}

// Saves a new session or updates an existing one
export async function saveSession(session: Partial<DemoEvent>): Promise<{ data: any; error: any }> {
  const payload = {
    title: session.title,
    description: session.description || "",
    subject_id: session.subjectId,
    date: session.date,
    end_date: session.endDate,
    venue: session.venue,
    capacity: session.capacity || 50,
    instructor: session.instructor,
    attendance_code: session.attendanceCode || null,
  };

  if (session.id) {
    // Update existing session
    const { data, error } = await supabase
      .from("sessions")
      .update(payload)
      .eq("id", session.id)
      .select()
      .single();
    return { data, error };
  } else {
    // Insert new session
    const { data, error } = await supabase
      .from("sessions")
      .insert([payload])
      .select()
      .single();
    return { data, error };
  }
}

// Deletes a session by ID
export async function deleteSession(sessionId: string): Promise<{ error: any }> {
  const { error } = await supabase
    .from("sessions")
    .delete()
    .eq("id", sessionId);
  
  return { error };
}

// Retrieves RSVPs for a specific user
export async function getUserRsvps(studentId: string): Promise<{ data: Rsvp[] | null; error: any }> {
  const { data, error } = await supabase
    .from("rsvps")
    .select("*")
    .eq("student_id", studentId);

  if (error) {
    console.error("Error fetching RSVPs:", error);
    return { data: null, error };
  }

  const mappedData = data.map((row) => ({
    id: row.id,
    eventId: row.session_id,
    userId: row.student_id,
    createdAt: row.created_at,
  }));

  return { data: mappedData, error: null };
}

// Toggles RSVP status for a student on a specific session
export async function toggleRsvp(sessionId: string, studentId: string): Promise<{ added: boolean; error: any }> {
  // Check if RSVP exists
  const { data: existing } = await supabase
    .from("rsvps")
    .select("id")
    .eq("session_id", sessionId)
    .eq("student_id", studentId)
    .single();

  if (existing) {
    // Remove RSVP
    const { error } = await supabase
      .from("rsvps")
      .delete()
      .eq("id", existing.id);
    return { added: false, error };
  } else {
    // Add RSVP
    const { error } = await supabase
      .from("rsvps")
      .insert([{ session_id: sessionId, student_id: studentId }]);
    return { added: true, error };
  }
}
