import { useEffect, useState } from "react";
import { AlertCircle, Edit3, Eye, FilePlus2, RefreshCw, Search, Upload, X } from "lucide-react";
import { EmptyState, InlineNotice, StatusBadge } from "../../../components/common/Feedback";
import type { ToastMessage } from "../../../components/common/Feedback";
import { useAppData } from "../../../context/AppDataContext";
import type { DemoNote, DemoNoteStatus, NoteWorkflowError } from "../../../types/app";
import { NotePreviewModal } from "../components/NotePreviewModal";

export function MyNotesPage({ onNotify }: { onNotify?: (toast: Omit<ToastMessage, "id">) => void }) {
  const { state, currentUser } = useAppData();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"All" | DemoNoteStatus>("All");
  const [editor, setEditor] = useState<DemoNote | "new" | null>(null);
  const [preview, setPreview] = useState<DemoNote | null>(null);

  const mine = state.notes
    .filter(
      (note) =>
        (note.uploaderId === currentUser?.id || note.uploaderId === currentUser?.authUserId) &&
        (status === "All" || note.status === status) &&
        (!query ||
          `${note.title} ${note.description} ${note.tags.join(" ")}`
            .toLowerCase()
            .includes(query.toLowerCase()))
    )
    .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="section-kicker">Personal contributions</div>
            <h1 className="page-heading">My Notes</h1>
            <p className="page-description">
              Prepare drafts, submit files for review, and respond to moderator feedback.
            </p>
          </div>
          <button className="primary-button" onClick={() => setEditor("new")}>
            <FilePlus2 size={15} /> Upload note
          </button>
        </header>

        <div className="mt-6 flex flex-col gap-3 rounded-xl bg-white p-4 demo-card sm:flex-row">
          <label className="search-field flex-1">
            <Search size={15} />
            <span className="sr-only">Search my notes</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search my notes"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            {(["All", "Draft", "Pending", "Approved", "Rejected"] as const).map((item) => (
              <button
                key={item}
                className={`filter-chip ${status === item ? "is-active" : ""}`}
                onClick={() => setStatus(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {mine.length ? (
          <div className="mt-5 grid gap-3">
            {mine.map((note) => (
              <article key={note.id} className="history-row items-start">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-bold">{note.title}</h2>
                    <StatusBadge status={note.status} />
                  </div>
                  <p className="mt-1 text-sm text-[#6F6F6F]">{note.description}</p>
                  {note.rejectionReason && (
                    <InlineNotice tone="error" title="Changes requested">
                      {note.rejectionReason}
                    </InlineNotice>
                  )}
                  <div className="mt-2 text-xs text-[#8A8377]">
                    {note.fileName ?? "No file attached"} - {note.tags.join(", ") || "No tags"}
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <button className="secondary-button" onClick={() => setPreview(note)}>
                    <Eye size={14} /> Preview
                  </button>
                  {note.status !== "Pending" && note.status !== "Approved" && (
                    <button className="primary-button" onClick={() => setEditor(note)}>
                      <Edit3 size={14} /> {note.status === "Rejected" ? "Edit and resubmit" : "Edit draft"}
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-5">
            <EmptyState
              icon={<Upload size={18} />}
              title="No notes in this view"
              body="Create a draft or change your filters."
              actionLabel="Upload a note"
              onAction={() => setEditor("new")}
            />
          </div>
        )}
      </div>

      {editor && (
        <NoteEditor
          note={editor === "new" ? undefined : editor}
          onClose={() => setEditor(null)}
          onNotify={onNotify}
        />
      )}
      <NotePreviewModal note={preview} onClose={() => setPreview(null)} />
    </div>
  );
}

export function NoteEditor({
  note,
  onClose,
  onNotify,
}: {
  note?: DemoNote;
  onClose: () => void;
  onNotify?: (toast: Omit<ToastMessage, "id">) => void;
}) {
  const { state, saveNote } = useAppData();
  const [persistedNote, setPersistedNote] = useState<DemoNote | undefined>(note);
  const [title, setTitle] = useState(note?.title ?? "");
  const [subjectId, setSubjectId] = useState(note?.subjectId ?? state.subjects[0]?.id ?? "");
  const [description, setDescription] = useState(note?.description ?? "");
  const [tags, setTags] = useState(note?.tags.join(", ") ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [workflowError, setWorkflowError] = useState<NoteWorkflowError | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [statusState, setStatusState] = useState<
    "idle" | "saving_draft" | "uploading_file" | "submitting" | "error"
  >("idle");

  useEffect(() => {
    if (!file || (!file.type.startsWith("image/") && file.type !== "application/pdf")) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  async function save(submit: boolean) {
    if (statusState !== "idle" && statusState !== "error") return;
    setWorkflowError(null);

    if (file && file.size > 25 * 1024 * 1024) {
      setWorkflowError({
        code: "FILE_VALIDATION_FAILED",
        stage: "validating",
        message: "File exceeds 25 MB size limit.",
        userFacingTitle: "File too large",
        userFacingDescription: "Study files must be 25 MB or smaller.",
      });
      setStatusState("error");
      return;
    }

    if (!title.trim()) {
      setWorkflowError({
        code: "VALIDATION_FAILED",
        stage: "validating",
        message: "Note title is required.",
        userFacingTitle: "Title required",
        userFacingDescription: "Please enter a title for your note.",
      });
      setStatusState("error");
      return;
    }

    if (submit && !file && !persistedNote?.fileId) {
      setWorkflowError({
        code: "NO_ATTACHMENT",
        stage: "validating",
        message: "Please attach a study file before submitting for review.",
        userFacingTitle: "Attachment required",
        userFacingDescription: "Please attach a study note file before submitting for review.",
      });
      setStatusState("error");
      return;
    }

    setStatusState(submit ? "submitting" : file ? "uploading_file" : "saving_draft");

    const result = await saveNote(
      {
        ...persistedNote,
        id: persistedNote?.id,
        title,
        subjectId,
        description,
        tags: tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        fileName: file?.name ?? persistedNote?.fileName,
        fileType: file?.type ?? persistedNote?.fileType,
        fileId: persistedNote?.fileId,
      },
      submit,
      file
    );

    if (result.note) {
      setPersistedNote(result.note);
    }

    if (!result.ok) {
      setStatusState("error");
      const err = result.errorDetail || {
        code: "DRAFT_SAVE_FAILED",
        stage: "saving_draft",
        message: result.message,
        userFacingTitle: "Note not saved",
        userFacingDescription: result.message,
      };
      setWorkflowError(err);

      // If draft was not found on the server (e.g. deleted or stale local state),
      // clear the invalid draft ID so subsequent save creates a fresh draft row cleanly.
      if (err.code === "DRAFT_NOT_FOUND") {
        setPersistedNote(undefined);
      }
      return;
    }

    setStatusState("idle");
    onNotify?.({
      tone: "success",
      title: submit ? "Note submitted" : "Draft saved",
      description: submit
        ? "Your note is ready for administrator review."
        : "Your changes have been saved.",
    });
    onClose();
  }

  const isBusy = statusState === "saving_draft" || statusState === "uploading_file" || statusState === "submitting";

  return (
    <div className="confirm-overlay" onMouseDown={isBusy ? undefined : onClose}>
      <div
        className="note-editor-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="note-editor-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <div>
            <div className="section-kicker">
              {persistedNote ? "Update contribution" : "New contribution"}
            </div>
            <h2 id="note-editor-title">
              {persistedNote?.status === "Rejected"
                ? "Edit and resubmit note"
                : persistedNote?.id
                ? "Edit study note draft"
                : "Upload study note"}
            </h2>
          </div>
          <button
            className="icon-button rounded-full bg-[#FAF8F2]"
            onClick={onClose}
            aria-label="Close note editor"
            disabled={isBusy}
          >
            <X size={16} />
          </button>
        </header>

        {persistedNote?.rejectionReason && (
          <InlineNotice tone="warning" title="Moderator feedback">
            {persistedNote.rejectionReason}
          </InlineNotice>
        )}

        {workflowError && (
          <InlineNotice
            tone={workflowError.code === "DRAFT_NOT_EDITABLE" ? "warning" : "error"}
            title={workflowError.userFacingTitle}
          >
            {workflowError.userFacingDescription}
          </InlineNotice>
        )}

        <div className="note-editor-grid">
          <label className="form-field">
            <span>Title</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              disabled={isBusy}
            />
          </label>

          <label className="form-field">
            <span>Subject</span>
            <select
              value={subjectId}
              onChange={(event) => setSubjectId(event.target.value)}
              disabled={isBusy}
            >
              {state.subjects
                .filter((item) => item.active)
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.code} - {item.name}
                  </option>
                ))}
            </select>
          </label>

          <label className="form-field md:col-span-2">
            <span>Description</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              disabled={isBusy}
            />
          </label>

          <label className="form-field md:col-span-2">
            <span>Tags (comma separated)</span>
            <input
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              placeholder="recursion, exam-review"
              disabled={isBusy}
            />
          </label>

          <label className="form-field md:col-span-2">
            <span>Study file</span>
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.docx,.pptx,.doc,.ppt"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              disabled={isBusy}
            />
            <small>
              {persistedNote?.fileName
                ? `Current: ${persistedNote.fileName}. Select another file to replace it.`
                : "PDF, image, DOCX, or PPTX up to 25 MB."}
            </small>
          </label>

          {previewUrl && (
            <div className="local-file-preview md:col-span-2">
              {file?.type === "application/pdf" ? (
                <iframe src={previewUrl} title="Selected PDF preview" />
              ) : (
                <img src={previewUrl} alt="Selected file preview" />
              )}
            </div>
          )}
        </div>

        <footer>
          <button
            type="button"
            className="secondary-button"
            onClick={() => save(false)}
            disabled={isBusy}
          >
            {statusState === "saving_draft" ? "Saving draft..." : "Save draft"}
          </button>

          {workflowError?.stage === "uploading_file" && file && (
            <button
              type="button"
              className="primary-button"
              onClick={() => save(persistedNote?.status === "Pending")}
              disabled={isBusy}
            >
              <RefreshCw size={15} /> Retry attachment
            </button>
          )}

          {workflowError?.stage === "submitting" && (
            <button
              type="button"
              className="primary-button"
              onClick={() => save(true)}
              disabled={isBusy}
            >
              <RefreshCw size={15} /> Retry submission
            </button>
          )}

          <button
            type="button"
            className="primary-button"
            onClick={() => save(true)}
            disabled={isBusy}
          >
            <Upload size={15} />{" "}
            {statusState === "uploading_file"
              ? "Uploading file..."
              : statusState === "submitting"
              ? "Submitting note..."
              : "Submit for review"}
          </button>
        </footer>
      </div>
    </div>
  );
}
