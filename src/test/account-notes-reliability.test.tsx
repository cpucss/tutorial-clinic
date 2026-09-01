import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AppDataProvider } from "../context/AppDataContext";
import { createSeedState, DEMO_STORAGE_KEY } from "../data/seed";
import { NoteEditor } from "../features/notes/pages/MyNotesPage";
import type { DemoNote } from "../types/app";
import * as notesRepository from "../services/supabase/notesRepository";

const serverDraft: DemoNote = {
  id: "11111111-1111-4111-8111-111111111111",
  title: "Reliable draft",
  subjectId: "sub-101",
  description: "One authoritative draft",
  tags: ["review"],
  uploaderId: "stu-042",
  status: "Draft",
  createdAt: "2026-08-31T00:00:00.000Z",
  updatedAt: "2026-08-31T00:00:00.000Z",
  downloads: 0,
};

function renderEditor(note?: DemoNote) {
  const seed = createSeedState();
  seed.currentUserId = "stu-042";
  window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(seed));
  const onClose = vi.fn();
  render(
    <AppDataProvider>
      <NoteEditor note={note} onClose={onClose} />
    </AppDataProvider>
  );
  return { onClose };
}

describe("account and note reliability regressions", () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("updates an existing draft instead of inserting another draft", async () => {
    const existing = { ...serverDraft, id: "22222222-2222-4222-8222-222222222222" };
    const saveSpy = vi.spyOn(notesRepository, "saveNoteDraft").mockResolvedValue({
      data: { ...existing, title: "Updated once" },
      error: null,
    });
    const { onClose } = renderEditor(existing);

    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Updated once" } });
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(saveSpy).toHaveBeenCalledTimes(1);
    expect(saveSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        noteId: existing.id,
        title: "Updated once",
      })
    );
  });

  it("uploads the selected file before submitting the same note", async () => {
    vi.spyOn(notesRepository, "saveNoteDraft").mockResolvedValue({ data: serverDraft, error: null });
    const uploadSpy = vi.spyOn(notesRepository, "replaceNoteFile").mockResolvedValue({
      file: {
        path: "stu-042/note/file.docx",
        name: "review.docx",
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      },
      error: null,
    });
    const submitSpy = vi.spyOn(notesRepository, "submitNote").mockResolvedValue({
      data: { ...serverDraft, status: "Pending" },
      error: null,
    });
    const { onClose } = renderEditor();

    fireEvent.change(screen.getByLabelText("Title"), { target: { value: serverDraft.title } });
    fireEvent.change(screen.getByLabelText("Description"), { target: { value: serverDraft.description } });
    const file = new File(["study material"], "review.docx", {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    fireEvent.change(screen.getByLabelText(/Study file/), { target: { files: [file] } });
    fireEvent.click(screen.getByRole("button", { name: "Submit for review" }));

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(uploadSpy).toHaveBeenCalledWith(serverDraft.id, file);
    expect(submitSpy).toHaveBeenCalledWith(serverDraft.id);
  });

  it("keeps the server draft ID after an upload error so retry cannot duplicate it", async () => {
    const saveSpy = vi.spyOn(notesRepository, "saveNoteDraft").mockResolvedValue({ data: serverDraft, error: null });
    vi.spyOn(notesRepository, "replaceNoteFile")
      .mockResolvedValueOnce({
        file: null,
        error: {
          code: "STORAGE_UPLOAD_FAILED",
          stage: "uploading_file",
          message: "Upload interrupted",
          userFacingTitle: "Attachment upload failed",
          userFacingDescription: "The file could not be uploaded to storage.",
        },
      })
      .mockResolvedValueOnce({
        file: {
          path: "stu-042/note/retry.docx",
          name: "retry.docx",
          type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        },
        error: null,
      });
    const { onClose } = renderEditor();

    fireEvent.change(screen.getByLabelText("Title"), { target: { value: serverDraft.title } });
    const file = new File(["retry"], "retry.docx", {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    fireEvent.change(screen.getByLabelText(/Study file/), { target: { files: [file] } });
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
    expect(await screen.findByText(/The file could not be uploaded to storage/)).toBeInTheDocument();

    // Verify Retry attachment button is available
    const retryBtn = screen.getByRole("button", { name: "Retry attachment" });
    expect(retryBtn).toBeInTheDocument();

    fireEvent.click(retryBtn);
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(saveSpy).toHaveBeenCalledTimes(2);
    expect(saveSpy.mock.calls[1][0].noteId).toBe(serverDraft.id);
  });

  it("handles DRAFT_NOT_FOUND by resetting the stale ID and allowing a fresh draft save", async () => {
    const staleNote = { ...serverDraft, id: "99999999-9999-9999-9999-999999999999" };
    const saveSpy = vi
      .spyOn(notesRepository, "saveNoteDraft")
      .mockResolvedValueOnce({
        data: null,
        error: {
          code: "DRAFT_NOT_FOUND",
          stage: "saving_draft",
          message: "DRAFT_NOT_FOUND: The requested note draft does not exist.",
          userFacingTitle: "Draft no longer available",
          userFacingDescription: "The selected note draft could not be found on the server.",
        },
      })
      .mockResolvedValueOnce({
        data: { ...serverDraft, id: "33333333-3333-4333-8333-333333333333" },
        error: null,
      });

    const { onClose } = renderEditor(staleNote);
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));

    expect(await screen.findByText(/The selected note draft could not be found on the server/)).toBeInTheDocument();

    // Resaving now passes undefined/null noteId, recovering cleanly
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));

    expect(saveSpy).toHaveBeenCalledTimes(2);
    expect(saveSpy.mock.calls[0][0].noteId).toBe(staleNote.id);
    expect(saveSpy.mock.calls[1][0].noteId).toBeUndefined();
  });

  it("verifies canonical storage bucket name and 25MB file size constant", () => {
    expect(notesRepository.TUTORIAL_NOTES_BUCKET).toBe("tutorial-notes");
    expect(notesRepository.NOTE_MAX_FILE_SIZE_BYTES).toBe(25 * 1024 * 1024);
    expect(notesRepository.ALLOWED_NOTE_MIME_TYPES).toContain("application/pdf");
    expect(notesRepository.ALLOWED_NOTE_MIME_TYPES).toContain("image/png");
  });
});
