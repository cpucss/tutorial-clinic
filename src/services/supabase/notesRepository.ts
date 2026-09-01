import { supabase } from "./client";
import type { DemoNote, DemoNoteStatus } from "../../types/app";
import type { Database } from "../../types/database.types";

type NoteRow = Database["public"]["Tables"]["notes"]["Row"];
type NoteFileRow = Database["public"]["Tables"]["note_files"]["Row"];

const NOTE_COLUMNS = "id, title, description, subject_id, tags, target_year_levels, uploader_id, status, downloads, rejection_reason, moderated_at, moderated_by, created_at, updated_at";
const NOTE_FILE_COLUMNS = "id, note_id, uploader_id, storage_path, file_name, mime_type, size_bytes, created_at";

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

function withFile(note: DemoNote, file?: NoteFileRow): DemoNote {
  if (!file) return note;
  return {
    ...note,
    fileName: file.file_name,
    fileType: file.mime_type,
    fileId: file.storage_path,
  };
}

async function attachLatestFiles(rows: NoteRow[]): Promise<{ data: DemoNote[] | null; error: string | null }> {
  const notes = rows.map(mapNoteRow);
  if (!rows.length) return { data: notes, error: null };

  const { data: files, error } = await supabase
    .from("note_files")
    .select(NOTE_FILE_COLUMNS)
    .in("note_id", rows.map((row) => row.id))
    .order("created_at", { ascending: false });

  if (error) return { data: null, error: error.message };

  const latestByNote = new Map<string, NoteFileRow>();
  for (const file of files || []) {
    if (!latestByNote.has(file.note_id)) latestByNote.set(file.note_id, file);
  }

  return {
    data: notes.map((note) => withFile(note, latestByNote.get(note.id))),
    error: null,
  };
}

// Retrieves all approved notes for students
export async function getApprovedNotes(): Promise<{ data: DemoNote[] | null; error: string | null }> {
  const { data, error } = await supabase
    .from("notes")
    .select(NOTE_COLUMNS)
    .eq("status", "Approved")
    .order("created_at", { ascending: false });

  if (error) return { data: null, error: error.message };
  return attachLatestFiles(data || []);
}

// Retrieves notes uploaded by the current user
export async function getMyNotes(userId: string): Promise<{ data: DemoNote[] | null; error: string | null }> {
  const { data, error } = await supabase
    .from("notes")
    .select(NOTE_COLUMNS)
    .eq("uploader_id", userId)
    .order("created_at", { ascending: false });

  if (error) return { data: null, error: error.message };
  return attachLatestFiles(data || []);
}

// Retrieves pending notes for admin moderation
export async function getPendingNotes(): Promise<{ data: DemoNote[] | null; error: string | null }> {
  const { data, error } = await supabase
    .from("notes")
    .select(NOTE_COLUMNS)
    .eq("status", "Pending")
    .order("created_at", { ascending: false });

  if (error) return { data: null, error: error.message };
  return attachLatestFiles(data || []);
}

// Creates or updates one authoritative draft. Existing IDs are updated instead
// of inserted, preventing an edited draft from becoming a duplicate row.
export async function saveNoteDraft(input: {
  noteId?: string;
  title: string;
  subjectId: string;
  description: string;
  tags: string[];
}): Promise<{ data: DemoNote | null; error: string | null }> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { data: null, error: "Not authenticated" };

  const payload = {
    title: input.title,
    subject_id: input.subjectId,
    description: input.description,
    tags: input.tags,
    uploader_id: userData.user.id,
    status: "Draft" as const,
    rejection_reason: null,
    moderated_at: null,
    moderated_by: null,
  };

  const query = input.noteId
    ? supabase
        .from("notes")
        .update(payload)
        .eq("id", input.noteId)
        .eq("uploader_id", userData.user.id)
    : supabase.from("notes").insert([payload]);

  const { data, error } = await query.select().single();

  if (error) return { data: null, error: error.message };
  return { data: mapNoteRow(data), error: null };
}

export async function createNoteDraft(input: {
  title: string;
  subjectId: string;
  description: string;
  tags: string[];
}): Promise<{ data: DemoNote | null; error: string | null }> {
  return saveNoteDraft(input);
}

export const TUTORIAL_NOTES_BUCKET = "tutorial-notes";
export const NOTE_MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB
export const ALLOWED_NOTE_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/msword",
  "application/vnd.ms-powerpoint",
];

// Uploads a file to the private tutorial-notes storage bucket and records metadata
export async function uploadNoteFile(
  noteId: string,
  file: File
): Promise<{ filePath: string | null; error: string | null }> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { filePath: null, error: "Not authenticated" };

  if (file.size > NOTE_MAX_FILE_SIZE_BYTES) {
    return { filePath: null, error: "File exceeds 25 MB size limit." };
  }

  const fileUuid = crypto.randomUUID();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `${userData.user.id}/${noteId}/${fileUuid}-${sanitizedName}`;

  // Upload to private bucket with upsert allowed by policy
  const { error: uploadError } = await supabase.storage
    .from(TUTORIAL_NOTES_BUCKET)
    .upload(storagePath, file, {
      cacheControl: "3600",
      upsert: true,
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

  if (metaError) {
    // Cleanup uploaded storage object if database record fails
    await supabase.storage.from(TUTORIAL_NOTES_BUCKET).remove([storagePath]);
    return { filePath: null, error: metaError.message };
  }

  return { filePath: storagePath, error: null };
}

export async function replaceNoteFile(
  noteId: string,
  file: File
): Promise<{ file: { path: string; name: string; type: string } | null; error: string | null; warning?: string }> {
  const { data: existingFiles, error: existingError } = await supabase
    .from("note_files")
    .select(NOTE_FILE_COLUMNS)
    .eq("note_id", noteId)
    .order("created_at", { ascending: false });

  if (existingError) return { file: null, error: existingError.message };

  const uploaded = await uploadNoteFile(noteId, file);
  if (uploaded.error || !uploaded.filePath) {
    return { file: null, error: uploaded.error || "File upload failed." };
  }

  const oldFiles = (existingFiles || []).filter((item) => item.storage_path !== uploaded.filePath);
  let warning: string | undefined;
  if (oldFiles.length) {
    const oldPaths = oldFiles.map((item) => item.storage_path);
    const { error: storageError } = await supabase.storage.from(TUTORIAL_NOTES_BUCKET).remove(oldPaths);
    if (storageError) {
      warning = "The new file was saved, but an older file could not be removed automatically.";
    } else {
      const { error: metadataError } = await supabase
        .from("note_files")
        .delete()
        .in("id", oldFiles.map((item) => item.id));
      if (metadataError) {
        warning = "The new file was saved, but older file metadata needs cleanup.";
      }
    }
  }

  return {
    file: { path: uploaded.filePath, name: file.name, type: file.type || "application/octet-stream" },
    error: null,
    warning,
  };
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
    .from(TUTORIAL_NOTES_BUCKET)
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
