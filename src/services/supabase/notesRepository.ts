import { supabase } from "./client";
import type { DemoNote, DemoNoteStatus } from "../../types/app";
import type { Database } from "../../types/database.types";

type NoteRow = Database["public"]["Tables"]["notes"]["Row"];

function mapNoteRow(row: NoteRow): DemoNote {
  return {
    id: row.id,
    title: row.title,
    subjectId: row.subject_id,
    description: row.description || "",
    tags: Array.isArray(row.tags) ? row.tags : [],
    uploaderId: row.uploader_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at || row.created_at,
    status: (row.status as DemoNoteStatus) || "Draft",
    fileName: undefined,
    fileType: undefined,
    fileId: undefined,
    downloads: row.downloads || 0,
    rejectionReason: row.rejection_reason || undefined,
    moderatedAt: row.moderated_at || undefined,
    moderatedBy: row.moderated_by || undefined,
  };
}

// Retrieves all approved notes for students
export async function getApprovedNotes(): Promise<{ data: DemoNote[] | null; error: string | null }> {
  const { data, error } = await supabase
    .from("notes")
    .select("id, title, description, subject_id, tags, target_year_levels, uploader_id, status, downloads, rejection_reason, moderated_at, moderated_by, created_at, updated_at")
    .eq("status", "Approved")
    .order("created_at", { ascending: false });

  if (error) return { data: null, error: error.message };
  return { data: (data || []).map(mapNoteRow), error: null };
}

// Retrieves notes uploaded by the current user
export async function getMyNotes(userId: string): Promise<{ data: DemoNote[] | null; error: string | null }> {
  const { data, error } = await supabase
    .from("notes")
    .select("id, title, description, subject_id, tags, target_year_levels, uploader_id, status, downloads, rejection_reason, moderated_at, moderated_by, created_at, updated_at")
    .eq("uploader_id", userId)
    .order("created_at", { ascending: false });

  if (error) return { data: null, error: error.message };
  return { data: (data || []).map(mapNoteRow), error: null };
}

// Retrieves pending notes for admin moderation
export async function getPendingNotes(): Promise<{ data: DemoNote[] | null; error: string | null }> {
  const { data, error } = await supabase
    .from("notes")
    .select("id, title, description, subject_id, tags, target_year_levels, uploader_id, status, downloads, rejection_reason, moderated_at, moderated_by, created_at, updated_at")
    .eq("status", "Pending")
    .order("created_at", { ascending: false });

  if (error) return { data: null, error: error.message };
  return { data: (data || []).map(mapNoteRow), error: null };
}

// Creates a draft note
export async function createNoteDraft(input: {
  title: string;
  subjectId: string;
  description: string;
  tags: string[];
}): Promise<{ data: DemoNote | null; error: string | null }> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { data: null, error: "Not authenticated" };

  const { data, error } = await supabase
    .from("notes")
    .insert([
      {
        title: input.title,
        subject_id: input.subjectId,
        description: input.description,
        tags: input.tags,
        uploader_id: userData.user.id,
        status: "Draft",
      },
    ])
    .select()
    .single();

  if (error) return { data: null, error: error.message };
  return { data: mapNoteRow(data), error: null };
}

// Uploads a file to the private tutorial-notes storage bucket and records metadata
export async function uploadNoteFile(
  noteId: string,
  file: File
): Promise<{ filePath: string | null; error: string | null }> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { filePath: null, error: "Not authenticated" };

  const fileUuid = crypto.randomUUID();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `${userData.user.id}/${noteId}/${fileUuid}-${sanitizedName}`;

  // Upload to private bucket without upsert
  const { error: uploadError } = await supabase.storage
    .from("tutorial-notes")
    .upload(storagePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) return { filePath: null, error: uploadError.message };

  // Insert metadata record in note_files table
  const { error: metaError } = await supabase.from("note_files").insert([
    {
      note_id: noteId,
      uploader_id: userData.user.id,
      storage_path: storagePath,
      file_name: file.name,
      mime_type: file.type || "application/octet-stream",
      size_bytes: file.size,
    },
  ]);

  if (metaError) return { filePath: null, error: metaError.message };

  return { filePath: storagePath, error: null };
}

// Submits a note for moderation
export async function submitNote(noteId: string): Promise<{ data: DemoNote | null; error: string | null }> {
  const { data, error } = await supabase
    .from("notes")
    .update({ status: "Pending" })
    .eq("id", noteId)
    .select()
    .single();

  if (error) return { data: null, error: error.message };
  return { data: mapNoteRow(data), error: null };
}

// Moderates a note via atomic RPC (awards 60 points on approval)
export async function moderateNote(
  noteId: string,
  status: "Approved" | "Rejected",
  reason?: string
): Promise<{ data: DemoNote | null; error: string | null }> {
  const { data, error } = await supabase.rpc("moderate_note", {
    p_note_id: noteId,
    p_status: status,
    p_reason: reason || null,
  });

  if (error) {
    return { data: null, error: error.message || "Failed to moderate note." };
  }

  return { data: data ? mapNoteRow(data) : null, error: null };
}

// Downloads a file from the private bucket
export async function downloadNoteFile(storagePath: string): Promise<{ data: Blob | null; error: string | null }> {
  const { data, error } = await supabase.storage
    .from("tutorial-notes")
    .download(storagePath);

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

// Retrieves favorite note IDs for the user
export async function getFavoriteNoteIds(): Promise<{ data: string[] | null; error: string | null }> {
  const { data, error } = await supabase.from("note_favorites").select("note_id");
  if (error) return { data: null, error: error.message };
  return { data: (data || []).map((r) => r.note_id), error: null };
}

// Toggles note favorite state
export async function toggleNoteFavorite(
  noteId: string,
  favorited: boolean
): Promise<{ error: string | null }> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { error: "Not authenticated" };

  if (favorited) {
    const { error } = await supabase.from("note_favorites").insert([
      {
        note_id: noteId,
        user_id: userData.user.id,
      },
    ]);
    return { error: error ? error.message : null };
  } else {
    const { error } = await supabase
      .from("note_favorites")
      .delete()
      .eq("note_id", noteId)
      .eq("user_id", userData.user.id);
    return { error: error ? error.message : null };
  }
}
