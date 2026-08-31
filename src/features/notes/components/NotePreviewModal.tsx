import { useEffect, useState } from "react";
import { Download, FileText, X } from "lucide-react";
import { EmptyState, StatusBadge } from "../../../components/common/Feedback";
import { useAppData } from "../../../context/AppDataContext";
import type { DemoNote } from "../../../types/app";
import { downloadNoteFile } from "../../../services/supabase/notesRepository";
import { formatDateTime } from "../../../utils/format";
import { getNoteFile } from "../../../utils/fileStorage";

export function NotePreviewModal({ note, onClose }: { note: DemoNote | null; onClose: () => void }) {
  const { state } = useAppData();
  const [url, setUrl] = useState<string | null>(null);
  const [file, setFile] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(false);
  const [fileError, setFileError] = useState("");
  useEffect(() => {
    let active = true; let objectUrl: string | null = null;
    async function loadFile() {
      if (!note?.fileId) return;
      setLoading(true);
      setFileError("");
      const stored = await getNoteFile(note.fileId);
      let blob: Blob | null = stored || null;
      if (!blob) {
        const remote = await downloadNoteFile(note.fileId);
        if (remote.error) {
          if (active) setFileError(remote.error);
          if (active) setLoading(false);
          return;
        }
        blob = remote.data;
      }
      if (active && blob) {
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
        setFile(blob);
      }
      if (active) setLoading(false);
    }
    void loadFile();
    const key = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", key);
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); document.removeEventListener("keydown", key); setUrl(null); setFile(null); };
  }, [note?.fileId, onClose]);
  if (!note) return null;
  const subject = state.subjects.find((item) => item.id === note.subjectId);
  const uploader = state.users.find((item) => item.id === note.uploaderId || item.authUserId === note.uploaderId);
  const download = () => { if (!url || !file) return; const anchor = document.createElement("a"); anchor.href = url; anchor.download = note.fileName || "tutorial-note"; anchor.click(); };
  const canEmbed = file && (file.type === "application/pdf" || file.type.startsWith("image/"));
  return <div className="confirm-overlay" onMouseDown={onClose}><div className="note-preview-dialog" role="dialog" aria-modal="true" aria-labelledby="note-preview-title" onMouseDown={(event) => event.stopPropagation()}><header><div><div className="section-kicker">Note preview</div><h2 id="note-preview-title">{note.title}</h2><div className="mt-2 flex flex-wrap gap-2"><StatusBadge status={note.status} /><StatusBadge status={subject?.code ?? "Unknown subject"} /></div></div><button className="icon-button rounded-full bg-[#FAF8F2]" onClick={onClose} aria-label="Close note preview"><X size={16} /></button></header><div className="note-preview-meta"><p>{note.description}</p><dl><div><dt>Uploader</dt><dd>{uploader?.name ?? "Unknown"}</dd></div><div><dt>Updated</dt><dd>{formatDateTime(note.updatedAt)}</dd></div><div><dt>File</dt><dd>{note.fileName ?? "No file attached"}</dd></div><div><dt>Tags</dt><dd>{note.tags.join(", ") || "None"}</dd></div></dl></div><div className="note-file-preview">{url && canEmbed ? (file?.type === "application/pdf" ? <iframe src={url} title={`Preview of ${note.title}`} /> : <img src={url} alt={`Preview of ${note.title}`} />) : <EmptyState icon={<FileText size={18} />} title={loading ? "Loading file" : fileError ? "File unavailable" : note.fileName ? "Preview unavailable" : "No file attached"} body={loading ? "Preparing your file..." : fileError ? "The file could not be opened. Try again or contact an administrator." : note.fileName ? "This file can be downloaded and opened in its supported application." : "Attach a supported file before submission."} />}</div><footer><button className="secondary-button" onClick={download} disabled={!url}><Download size={15} /> Download file</button><button className="primary-button" onClick={onClose}>Done</button></footer></div></div>;
}
