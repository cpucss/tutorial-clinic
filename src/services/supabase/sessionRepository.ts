import { supabase } from "./client";
import type { DemoEvent, Rsvp, Subject, SessionStatus } from "../../types/app";
import type { YearLevel } from "../../types/common";
import type { Database } from "../../types/database.types";

type SessionRow = Database["public"]["Tables"]["sessions"]["Row"];
type SubjectRow = Database["public"]["Tables"]["subjects"]["Row"];
type RsvpRow = Database["public"]["Tables"]["rsvps"]["Row"];

const yearLevels: YearLevel[] = ["Freshman", "Sophomore", "Junior", "Senior"];

function asYearLevelArray(values: unknown): YearLevel[] {
  if (!Array.isArray(values)) return ["Freshman", "Sophomore", "Junior", "Senior"];
  return values.filter((v): v is YearLevel => yearLevels.includes(v as YearLevel));
}

function mapSessionRow(row: SessionRow): DemoEvent {
  return {
    id: row.id,
    title: row.title,
    description: row.description || "",
    subjectId: row.subject_id,
    date: row.date,
    endDate: row.end_date,
    venue: row.venue,
    capacity: row.capacity || 50,
    instructor: row.instructor || "To Be Determined",
    instructorRole: row.instructor_role || "Facilitator",
    status: (row.status as SessionStatus) || "Upcoming",
    topics: Array.isArray(row.topics) ? row.topics : [],
    yearLevels: asYearLevelArray(row.year_levels),
    attendanceCode: "",
    createdAt: row.created_at || new Date().toISOString(),
  };
}

function mapSubjectRow(row: SubjectRow): Subject {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    yearLevel: (row.year_level as YearLevel) || "Freshman",
    coordinator: row.coordinator || "TBD",
    active: row.active !== false,
  };
}

function mapRsvpRow(row: RsvpRow): Rsvp {
  return {
    id: row.id,
    eventId: row.session_id,
    userId: row.user_id,
    createdAt: row.created_at,
  };
}

// Retrieves all available subjects
export async function getSubjects(): Promise<{ data: Subject[] | null; error: string | null }> {
  const { data, error } = await supabase
    .from("subjects")
    .select("*")
    .order("code", { ascending: true });

  if (error) {
    console.error("Error fetching subjects:", error);
    return { data: null, error: error.message };
  }

  return { data: ((data as SubjectRow[]) || []).map(mapSubjectRow), error: null };
}

// Saves a new curriculum subject or updates an existing one in Supabase
export async function upsertSubject(subject: Subject): Promise<{ data: Subject | null; error: string | null }> {
  const payload: Database["public"]["Tables"]["subjects"]["Insert"] = {
    id: subject.id,
    code: subject.code.trim().toUpperCase(),
    name: subject.name.trim(),
    year_level: subject.yearLevel,
    coordinator: subject.coordinator?.trim() || "TBD",
    active: subject.active ?? true,
  };

  const { data, error } = await supabase
    .from("subjects")
    .upsert(payload)
    .select("*")
    .single();

  if (error) {
    console.error("Error saving subject:", error);
    return { data: null, error: error.message };
  }

  return { data: mapSubjectRow(data as SubjectRow), error: null };
}

// Deletes a subject from Supabase
export async function deleteSubjectRecord(id: string): Promise<{ success: boolean; error: string | null }> {
  const { error } = await supabase
    .from("subjects")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting subject:", error);
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}

// Retrieves all sessions from the database, ordered by start date
export async function getSessions(): Promise<{ data: DemoEvent[] | null; error: string | null }> {
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .order("date", { ascending: true });

  if (error) {
    console.error("Error fetching sessions:", error);
    return { data: null, error: error.message };
  }

  return { data: ((data as SessionRow[]) || []).map(mapSessionRow), error: null };
}

// Saves a new session or updates an existing one (returns the canonical database record)
export async function saveSession(session: Partial<DemoEvent>): Promise<{ data: DemoEvent | null; error: string | null }> {
  const payload: Database["public"]["Tables"]["sessions"]["Insert"] = {
    title: session.title ?? "Untitled Session",
    description: session.description || "",
    subject_id: session.subjectId ?? "",
    date: session.date ?? new Date().toISOString(),
    end_date: session.endDate ?? new Date().toISOString(),
    venue: session.venue ?? "Tutorial Room",
    capacity: session.capacity || 50,
    instructor: session.instructor || "To Be Determined",
    instructor_role: session.instructorRole || "Facilitator",
    status: (session.status as SessionStatus) || "Upcoming",
    topics: session.topics || [],
    year_levels: (session.yearLevels as ("Freshman" | "Sophomore" | "Junior" | "Senior")[]) || ["Freshman", "Sophomore", "Junior", "Senior"],
  };

  if (session.id && !session.id.startsWith("evt-")) {
    // Update existing database UUID session
    const { data, error } = await supabase
      .from("sessions")
      .update(payload)
      .eq("id", session.id)
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data: mapSessionRow(data as SessionRow), error: null };
  } else {
    // Insert new session (let PostgreSQL generate the UUID)
    const { data, error } = await supabase
      .from("sessions")
      .insert([payload])
      .select()
      .single();

    if (error) return { data: null, error: error.message };

    // If an attendance code was provided during creation, set it via RPC
    if (session.attendanceCode && data?.id) {
      await setSessionAttendanceCode(data.id, session.attendanceCode);
    }

    return { data: mapSessionRow(data as SessionRow), error: null };
  }
}

// Deletes a session by ID
export async function deleteSession(sessionId: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("sessions")
    .delete()
    .eq("id", sessionId);
  
  return { error: error ? error.message : null };
}

// Sets the private attendance code hash for a session via admin RPC
export async function setSessionAttendanceCode(sessionId: string, code: string): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc("set_session_attendance_code", {
    p_session_id: sessionId,
    p_code: code.trim().toUpperCase(),
  });

  return { error: error ? error.message : null };
}

// Retrieves RSVPs for a specific user UUID
export async function getUserRsvps(userId?: string): Promise<{ data: Rsvp[] | null; error: string | null }> {
  let query = supabase
    .from("rsvps")
    .select("*");

  if (userId) query = query.eq("user_id", userId);
  const { data, error } = await query;

  if (error) {
    console.error("Error fetching RSVPs:", error);
    return { data: null, error: error.message };
  }

  return { data: ((data as RsvpRow[]) || []).map(mapRsvpRow), error: null };
}

export async function getSavedSessionIds(): Promise<{ data: string[] | null; error: string | null }> {
  const { data, error } = await supabase
    .from("saved_sessions")
    .select("session_id")
    .order("created_at", { ascending: false });

  if (error) return { data: null, error: error.message };
  return { data: (data || []).map((row) => row.session_id), error: null };
}

export async function setSavedSession(
  sessionId: string,
  saved: boolean
): Promise<{ error: string | null }> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return { error: "Your session has expired. Sign in again." };

  const query = saved
    ? supabase.from("saved_sessions").upsert({ user_id: userData.user.id, session_id: sessionId })
    : supabase.from("saved_sessions").delete().eq("user_id", userData.user.id).eq("session_id", sessionId);
  const { error } = await query;
  return { error: error?.message || null };
}

// Atomic RSVP join / cancel via database RPC
export async function setRsvp(
  sessionId: string,
  joined: boolean
): Promise<{ joined: boolean; rsvp: Rsvp | null; error: string | null }> {
  const { data, error } = await supabase.rpc("set_rsvp", {
    p_session_id: sessionId,
    p_joined: joined,
  });

  if (error) {
    return {
      joined: false,
      rsvp: null,
      error: error.message || "Failed to update RSVP.",
    };
  }

  const resultData = data as { joined: boolean; rsvp: RsvpRow | null } | null;

  if (resultData?.joined && resultData?.rsvp) {
    return {
      joined: true,
      rsvp: {
        id: resultData.rsvp.id,
        eventId: resultData.rsvp.session_id,
        userId: resultData.rsvp.user_id,
        createdAt: resultData.rsvp.created_at,
      },
      error: null,
    };
  }

  return {
    joined: false,
    rsvp: null,
    error: null,
  };
}
