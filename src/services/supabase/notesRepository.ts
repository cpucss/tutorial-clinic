import { supabase } from "./client";
import type {
  DemoNote,
  DemoNoteStatus,
  NoteWorkflowError,
  NoteWorkflowErrorCode,
  NoteWorkflowStage,
} from "../../types/app";
import type { Database } from "../../types/database.types";

type NoteRow = Database["public"]["Tables"]["notes"]["Row"];
type NoteFileRow = Database["public"]["Tables"]["note_files"]["Row"];

const NOTE_COLUMNS =
  "id, title, description, subject_id, tags, target_year_levels, uploader_id, status, downloads, rejection_reason, moderated_at, moderated_by, created_at, updated_at";
const NOTE_FILE_COLUMNS =
  "id, note_id, uploader_id, storage_path, file_name, mime_type, size_bytes, created_at";

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

function isUuid(val?: string | null): boolean {
  if (!val) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);
}

export function parseWorkflowError(stage: NoteWorkflowStage, rawError: any): NoteWorkflowError {
  const msg =
    typeof rawError === "string"
      ? rawError
      : rawError?.message || "An unexpected error occurred.";

  if (msg.includes("DRAFT_NOT_FOUND") || msg.includes("PGRST116")) {
    return {
      code: "DRAFT_NOT_FOUND",
      stage,
      message: msg,
      userFacingTitle: "Draft no longer available",
      userFacingDescription: "The selected note draft could not be found on the server.",
    };
  }
  if (msg.includes("DRAFT_NOT_EDITABLE")) {
    return {
      code: "DRAFT_NOT_EDITABLE",
      stage,
      message: msg,
      userFacingTitle: "Note is not editable",
      userFacingDescription:
        "This note is currently being reviewed or has already been approved.",
    };
  }
  if (msg.includes("NO_ATTACHMENT")) {
    return {
      code: "NO_ATTACHMENT",
      stage,
      message: msg,
      userFacingTitle: "Attachment required",
      userFacingDescription: "Please attach a study note file before submitting for review.",
    };
  }
  if (msg.includes("UNAUTHORIZED")) {
    return {
      code: "UNAUTHORIZED",
      stage,
      message: msg,
      userFacingTitle: "Unauthorized",
      userFacingDescription: "You do not have permission to modify this note.",
    };
  }
  if (msg.includes("VALIDATION_FAILED")) {
    const cleanMsg = msg.replace(/^VALIDATION_FAILED:\s*/, "");
    return {
      code: "VALIDATION_FAILED",
      stage,
      message: cleanMsg,
      userFacingTitle: "Validation failed",
      userFacingDescription: cleanMsg,
    };
  }
  if (stage === "uploading_file") {
    return {
      code: "STORAGE_UPLOAD_FAILED",
      stage,
      message: msg,
      userFacingTitle: "Attachment upload failed",
      userFacingDescription:
        "We couldn’t upload your attachment. Your draft is safe. Please try again.",
    };
  }
  if (stage === "saving_metadata") {
    return {
      code: "FILE_METADATA_FAILED",
      stage,
      message: msg,
      userFacingTitle: "Attachment could not be saved",
      userFacingDescription:
        "The file was uploaded, but the file record could not be saved. Please try again.",
    };
  }
  if (stage === "submitting") {
    return {
      code: "NOTE_SUBMISSION_FAILED",
      stage,
      message: msg,
      userFacingTitle: "Submission failed",
      userFacingDescription:
        "Draft was saved, but submitting for review failed. You can retry submission.",
    };
  }
  return {
    code: "DRAFT_SAVE_FAILED",
    stage,
    message: msg,
    userFacingTitle: "Note not saved",
    userFacingDescription: msg,
  };
}

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

async function attachLatestFiles(
  rows: NoteRow[]
): Promise<{ data: DemoNote[] | null; error: string | null }> {
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
export async function getMyNotes(
  userId: string
): Promise<{ data: DemoNote[] | null; error: string | null }> {
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

// Creates or updates one authoritative draft via server-side RPC
export async function saveNoteDraft(input: {
  noteId?: string;
  title: string;
  subjectId: string;
  description: string;
  tags: string[];
}): Promise<{ data: DemoNote | null; error: NoteWorkflowError | null }> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return {
      data: null,
      error: parseWorkflowError("saving_draft", "UNAUTHORIZED: Authentication required."),
    };
  }

  const validId = isUuid(input.noteId) ? input.noteId : null;

  const { data, error } = await supabase.rpc("save_my_note_draft", {
    p_note_id: validId,
    p_title: input.title,
    p_subject_id: input.subjectId,
    p_description: input.description,
    p_tags: input.tags,
  });

  if (error) {
    return { data: null, error: parseWorkflowError("saving_draft", error) };
  }

  return { data: mapNoteRow(data as NoteRow), error: null };
}

export async function createNoteDraft(input: {
  title: string;
  subjectId: string;
  description: string;
  tags: string[];
}): Promise<{ data: DemoNote | null; error: NoteWorkflowError | null }> {
  return saveNoteDraft(input);
}

// Uploads a file to the private tutorial-notes storage bucket and records metadata
export async function uploadNoteFile(
  noteId: string,
  file: File
): Promise<{ filePath: string | null; error: NoteWorkflowError | null }> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return {
      filePath: null,
      error: parseWorkflowError("uploading_file", "UNAUTHORIZED: Authentication required."),
    };
  }

  if (file.size > NOTE_MAX_FILE_SIZE_BYTES) {
    return {
      filePath: null,
      error: {
        code: "FILE_VALIDATION_FAILED",
        stage: "validating",
        message: "File exceeds 25 MB size limit.",
        userFacingTitle: "File too large",
        userFacingDescription: "Study files must be 25 MB or smaller.",
      },
    };
  }

  const fileUuid = crypto.randomUUID();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `${userData.user.id}/${noteId}/${fileUuid}-${sanitizedName}`;

  // Upload to private bucket with immutable objects (upsert: false)
  const { error: uploadError } = await supabase.storage
    .from(TUTORIAL_NOTES_BUCKET)
    .upload(storagePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    return { filePath: null, error: parseWorkflowError("uploading_file", uploadError) };
  }

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
    // Cleanup newly uploaded storage object if database record fails
    await supabase.storage.from(TUTORIAL_NOTES_BUCKET).remove([storagePath]);
    return { filePath: null, error: parseWorkflowError("saving_metadata", metaError) };
  }

  return { filePath: storagePath, error: null };
}

export async function replaceNoteFile(
  noteId: string,
  file: File
): Promise<{
  file: { path: string; name: string; type: string } | null;
  error: NoteWorkflowError | null;
  warning?: string;
}> {
  const { data: existingFiles } = await supabase
    .from("note_files")
    .select(NOTE_FILE_COLUMNS)
    .eq("note_id", noteId)
    .order("created_at", { ascending: false });

  const uploaded = await uploadNoteFile(noteId, file);
  if (uploaded.error || !uploaded.filePath) {
    return { file: null, error: uploaded.error };
  }

  const oldFiles = (existingFiles || []).filter((item) => item.storage_path !== uploaded.filePath);
  let warning: string | undefined;
  if (oldFiles.length) {
    const oldPaths = oldFiles.map((item) => item.storage_path);
    const { error: storageError } = await supabase.storage.from(TUTORIAL_NOTES_BUCKET).remove(oldPaths);
    if (storageError) {
      warning = "The new file was saved, but older files could not be removed automatically.";
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

// Submits a note for moderation via server-side RPC
export async function submitNote(
  noteId: string
): Promise<{ data: DemoNote | null; error: NoteWorkflowError | null }> {
  const { data, error } = await supabase.rpc("submit_my_note", {
    p_note_id: noteId,
  });

  if (error) {
    return { data: null, error: parseWorkflowError("submitting", error) };
  }

  return { data: mapNoteRow(data as NoteRow), error: null };
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

  return { data: data ? mapNoteRow(data as NoteRow) : null, error: null };
}

// Downloads a file from the private bucket
export async function downloadNoteFile(
  storagePath: string
): Promise<{ data: Blob | null; error: string | null }> {
  const { data, error } = await supabase.storage.from(TUTORIAL_NOTES_BUCKET).download(storagePath);

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

// Securely deletes an eligible note (Draft or Rejected) and cleans up its private storage objects
export async function deleteNote(
  noteId: string
): Promise<{ ok: boolean; error: NoteWorkflowError | null }> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return {
      ok: false,
      error: parseWorkflowError("saving_draft", "UNAUTHORIZED: Authentication required."),
    };
  }

  if (!isUuid(noteId)) {
    return {
      ok: false,
      error: {
        code: "DRAFT_NOT_FOUND",
        stage: "saving_draft",
        message: "Invalid note identifier.",
        userFacingTitle: "Draft not found",
        userFacingDescription: "The note draft could not be found.",
      },
    };
  }

  // Phase 1: Retrieve deletable storage paths for this note
  const { data: paths, error: pathsError } = await supabase.rpc("get_deletable_note_paths", {
    p_note_id: noteId,
  });

  if (pathsError) {
    return {
      ok: false,
      error: parseWorkflowError("saving_draft", pathsError),
    };
  }

  // Phase 2: Remove storage objects while note is still in Draft/Rejected status
  const storagePaths = (paths as string[]) || [];
  if (storagePaths.length > 0) {
    const { error: storageError } = await supabase.storage
      .from(TUTORIAL_NOTES_BUCKET)
      .remove(storagePaths);

    if (storageError) {
      return {
        ok: false,
        error: {
          code: "STORAGE_UPLOAD_FAILED",
          stage: "saving_draft",
          message: storageError.message,
          userFacingTitle: "Could not delete note attachment",
          userFacingDescription:
            "We couldn’t completely delete this note. Please try again. Your note has not been reported as deleted.",
        },
      };
    }
  }

  // Phase 3: Finalize database deletion
  const { error: deleteError } = await supabase.rpc("delete_my_note", {
    p_note_id: noteId,
  });

  if (deleteError) {
    return {
      ok: false,
      error: parseWorkflowError("saving_draft", deleteError),
    };
  }

  return { ok: true, error: null };
}
