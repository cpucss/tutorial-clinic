import React, { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Search, Bold, Italic, Link as LinkIcon, ChevronDown, Trash2 } from "lucide-react";
import { differenceInCalendarDays, format } from "date-fns";
import { ConfirmDialog, EmptyState } from "../../../components/common/Feedback";
import type { ToastMessage } from "../../../components/common/Feedback";

type MyNote = {
  id: string;
  title: string;
  bodyHtml: string;
  createdAt: string;
  updatedAt: string;
};

type SaveStatus = "saving" | "saved";

const STORAGE_KEY = "tutorialclinic.mynotes.v1";
const NOTE_SURFACE = "#FFFFFF";
const NOTE_ACTIVE_SURFACE = "#FFF3DF";

const SEED: MyNote[] = [
  {
    id: "seed-1",
    title: "Visual Overview",
    bodyHtml:
      "<p>This app will serve as a hub for student from lower years to be able to study efficiently. <b>Tutorial Clinic</b> is an initiative from Computer Science Society where we organized study sessions with Seniors or Teachers as speakers to accommodate the pain point of students when studying and where they struggle.</p><p>Now for the Web App, this web app will focus on web mobile browsers but still would accommodate web desktop browser.</p><h3>Requirements</h3><p>A timeline of events for the next session of tutorial clinic. They can see the year level <a href=\"https://example.com\" target=\"_blank\" rel=\"noopener\">accommodated</a> to that event and the speaker and the topics.</p>",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "seed-2",
    title: "The Tutorial Clinic App",
    bodyHtml:
      "<h1>The Tutorial Clinic App</h1><p>This app will serve as a hub for student from lower years to be able to study efficiently.</p><p>Now for the Web App, this web app will focus on web mobile browsers but still would accommodate web desktop browser.</p><h3>Here are the requirements / feature.</h3><p>A way for students to log in.</p><p>Students can generate a qr to rsvp to a certain event/session, the receptionist will scan the qr and it will log in as an attendance.</p>",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
  },
];

const HEADING_OPTIONS: { label: string; tag: string }[] = [
  { label: "Body", tag: "p" },
  { label: "Heading 1", tag: "h1" },
  { label: "Heading 2", tag: "h2" },
  { label: "Heading 3", tag: "h3" },
  { label: "Heading 4", tag: "h4" },
  { label: "Heading 5", tag: "h5" },
  { label: "Heading 6", tag: "h6" },
];

function normalizeLinkHref(value: string) {
  const trimmed = value.trim();
  if (!trimmed || trimmed === "https://") return "";
  if (/^(https?:\/\/|mailto:)/i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function loadNotes(): MyNote[] {
  if (typeof window === "undefined") return SEED;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED;
    const parsed = JSON.parse(raw) as MyNote[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : SEED;
  } catch {
    return SEED;
  }
}

function saveNotes(notes: MyNote[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch {
    /* ignore quota */
  }
}

function groupByRecency(notes: MyNote[]) {
  const today: MyNote[] = [];
  const last7: MyNote[] = [];
  const last30: MyNote[] = [];
  const older: MyNote[] = [];
  const now = new Date();
  for (const n of notes) {
    const days = differenceInCalendarDays(now, new Date(n.updatedAt));
    if (days <= 0) today.push(n);
    else if (days <= 7) last7.push(n);
    else if (days <= 30) last30.push(n);
    else older.push(n);
  }
  const sorter = (a: MyNote, b: MyNote) => b.updatedAt.localeCompare(a.updatedAt);
  return {
    today: today.sort(sorter),
    last7: last7.sort(sorter),
    last30: last30.sort(sorter),
    older: older.sort(sorter),
  };
}

function htmlToSnippet(html: string) {
  if (typeof document === "undefined") return "";
  const div = document.createElement("div");
  div.innerHTML = html;
  return (div.textContent ?? "").trim();
}

export function MyNotesPage({
  onBreadcrumbChange,
  onNotify,
}: {
  onBreadcrumbChange?: (b: string) => void;
  onNotify?: (toast: Omit<ToastMessage, "id">) => void;
}) {
  const [notes, setNotes] = useState<MyNote[]>(() => loadNotes());
  const [selectedId, setSelectedId] = useState<string>(() => loadNotes()[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MyNote | null>(null);
  const saveFeedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setSaveStatus("saving");
    const id = setTimeout(() => {
      saveNotes(notes);
      setLastSavedAt(new Date());
      setSaveStatus("saved");
    }, 200);
    return () => clearTimeout(id);
  }, [notes]);

  useEffect(() => {
    return () => {
      if (saveFeedbackTimer.current) clearTimeout(saveFeedbackTimer.current);
    };
  }, []);

  const selected = notes.find((n) => n.id === selectedId) ?? notes[0];

  useEffect(() => {
    onBreadcrumbChange?.(selected?.title?.trim() ? selected.title : "New note");
  }, [selected, onBreadcrumbChange]);

  const filtered = useMemo(() => {
    if (!query.trim()) return notes;
    const q = query.toLowerCase();
    return notes.filter((n) =>
      n.title.toLowerCase().includes(q) || htmlToSnippet(n.bodyHtml).toLowerCase().includes(q),
    );
  }, [notes, query]);

  const groups = useMemo(() => groupByRecency(filtered), [filtered]);

  function createNote() {
    const now = new Date().toISOString();
    const n: MyNote = {
      id: "n-" + Date.now(),
      title: "",
      bodyHtml: "<p></p>",
      createdAt: now,
      updatedAt: now,
    };
    setNotes((prev) => [n, ...prev]);
    setSelectedId(n.id);
    onNotify?.({ tone: "success", title: "New note created", description: "It is saved in this browser for now." });
  }

  function updateSelected(patch: Partial<MyNote>) {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === selected?.id
          ? { ...n, ...patch, updatedAt: new Date().toISOString() }
          : n,
      ),
    );
  }

  function deleteNote(id: string) {
    setNotes((prev) => {
      const next = prev.filter((n) => n.id !== id);
      if (id === selectedId) setSelectedId(next[0]?.id ?? "");
      return next;
    });
    onNotify?.({ tone: "warning", title: "Note deleted", description: "The local note was removed from My Notes." });
  }

  function saveNow() {
    saveNotes(notes);
    setLastSavedAt(new Date());
    setSaveStatus("saving");
    if (saveFeedbackTimer.current) clearTimeout(saveFeedbackTimer.current);
    saveFeedbackTimer.current = setTimeout(() => setSaveStatus("saved"), 180);
  }

  return (
    <>
    <div className="flex h-full flex-col lg:flex-row">
      <aside className="w-full shrink-0 px-4 py-5 flex flex-col lg:h-full lg:w-[310px]" style={{ background: NOTE_SURFACE }}>
        <div className="flex items-center justify-between mb-3">
          <h1 style={{ fontSize: 30, fontWeight: 700, color: "#1C1C1C", lineHeight: 1.2 }}>My Notes</h1>
          <button
            onClick={createNote}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{ background: "#F5A623", color: "#fff", fontSize: 12, fontWeight: 500 }}
          >
            <Plus size={12} /> New
          </button>
        </div>

        <div className="relative mb-4">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" color="#6F6F6F" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notes..."
            className="w-full h-9 rounded-full bg-white pl-8 pr-3 outline-none"
            style={{ fontSize: 13, color: "#1C1C1C", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
          />
        </div>

        <div className="flex max-h-[34dvh] flex-col gap-3 overflow-y-auto lg:max-h-none">
          <NoteGroup label="Today" notes={groups.today} selectedId={selected?.id} onSelect={setSelectedId} onDelete={(note) => setDeleteTarget(note)} />
          <NoteGroup label="Previous 7 Days" notes={groups.last7} selectedId={selected?.id} onSelect={setSelectedId} onDelete={(note) => setDeleteTarget(note)} />
          <NoteGroup label="Previous 30 Days" notes={groups.last30} selectedId={selected?.id} onSelect={setSelectedId} onDelete={(note) => setDeleteTarget(note)} />
          <NoteGroup label="Older" notes={groups.older} selectedId={selected?.id} onSelect={setSelectedId} onDelete={(note) => setDeleteTarget(note)} />
          {filtered.length === 0 && (
            <EmptyState
              icon={<Search size={18} />}
              title={query ? "No notes match" : "No personal notes yet"}
              body={query ? "Try a shorter search term." : "Create your first private note and it will be saved in this browser."}
              actionLabel={!query ? "New note" : undefined}
              onAction={!query ? createNote : undefined}
            />
          )}
        </div>
      </aside>

      <section className="min-w-0 flex-1 overflow-y-auto" style={{ background: NOTE_SURFACE }}>
        {selected ? (
          <Editor
            key={selected.id}
            note={selected}
            onChangeTitle={(title) => updateSelected({ title })}
            onChangeBody={(bodyHtml) => updateSelected({ bodyHtml })}
            onSave={saveNow}
            saveStatus={saveStatus}
            lastSavedAt={lastSavedAt}
          />
        ) : (
          <div className="h-full flex items-center justify-center p-6">
            <EmptyState
              icon={<Plus size={18} />}
              title="Pick or create a note"
              body="Select a note on the left, or start a new one from the sidebar."
              actionLabel="New note"
              onAction={createNote}
            />
          </div>
        )}
      </section>
    </div>
    <ConfirmDialog
      open={Boolean(deleteTarget)}
      title="Delete this note?"
      body={`"${deleteTarget?.title.trim() || "Untitled"}" will be removed from local storage.`}
      confirmLabel="Delete note"
      cancelLabel="Keep note"
      tone="error"
      onCancel={() => setDeleteTarget(null)}
      onConfirm={() => {
        if (deleteTarget) deleteNote(deleteTarget.id);
        setDeleteTarget(null);
      }}
    />
    </>
  );
}

function NoteGroup({
  label,
  notes,
  selectedId,
  onSelect,
  onDelete,
}: {
  label: string;
  notes: MyNote[];
  selectedId?: string;
  onSelect: (id: string) => void;
  onDelete: (note: MyNote) => void;
}) {
  if (notes.length === 0) return null;
  return (
    <div>
      <div className="px-3 mb-1" style={{ fontSize: 11, letterSpacing: "0.08em", color: "#BBBBBB" }}>
        {label.toUpperCase()}
      </div>
      <ul className="flex flex-col">
        {notes.map((n) => (
          <NoteRow
            key={n.id}
            note={n}
            active={n.id === selectedId}
            onClick={() => onSelect(n.id)}
            onDelete={() => onDelete(n)}
          />
        ))}
      </ul>
    </div>
  );
}

function NoteRow({
  note,
  active,
  onClick,
  onDelete,
}: {
  note: MyNote;
  active: boolean;
  onClick: () => void;
  onDelete: () => void;
}) {
  const snippet = htmlToSnippet(note.bodyHtml);
  return (
    <li className="relative">
      <button
        onClick={onClick}
        className="w-full text-left px-3 py-2 rounded-md"
        style={{ background: active ? NOTE_ACTIVE_SURFACE : "transparent" }}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div
              className="truncate"
              style={{ fontSize: 14, fontWeight: 700, color: "#1C1C1C" }}
            >
              {note.title.trim() || "Untitled"}
            </div>
            <div
              className="truncate"
              style={{ fontSize: 12, color: "#6F6F6F" }}
            >
              {format(new Date(note.updatedAt), "MMM d")} - {snippet.slice(0, 60) || "No additional text"}
            </div>
          </div>
          {active && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="shrink-0 inline-flex items-center justify-center rounded-full"
              style={{ width: 22, height: 22, color: "#6F6F6F" }}
              aria-label="Delete note"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </button>
    </li>
  );
}

function Editor({
  note,
  onChangeTitle,
  onChangeBody,
  onSave,
  saveStatus,
  lastSavedAt,
}: {
  note: MyNote;
  onChangeTitle: (s: string) => void;
  onChangeBody: (html: string) => void;
  onSave: () => void;
  saveStatus: SaveStatus;
  lastSavedAt: Date | null;
}) {
  const titleRef = useRef<HTMLInputElement | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const initialBodyHtml = useRef(note.bodyHtml || "<p></p>");
  const [, force] = useState(0);
  const [headingOpen, setHeadingOpen] = useState(false);
  const [linkPopover, setLinkPopover] = useState<{ url: string; text: string; hasSelection: boolean } | null>(null);

  useEffect(() => {
    function handleSelectionChange() {
      if (isCurrentSelectionInsideBody()) {
        saveSelection();
        refreshToolbar();
      }
    }

    document.addEventListener("selectionchange", handleSelectionChange);
    return () => document.removeEventListener("selectionchange", handleSelectionChange);
  }, []);

  function refreshToolbar() {
    force((x) => x + 1);
  }

  function isNodeInsideBody(node: Node | null) {
    for (let current = node; current; current = current.parentNode) {
      if (current === bodyRef.current) return true;
    }
    return false;
  }

  function currentSelectionRange() {
    if (typeof document === "undefined") return null;
    const sel = document.getSelection();
    if (!sel || sel.rangeCount === 0) return null;
    if (!isNodeInsideBody(sel.anchorNode) || !isNodeInsideBody(sel.focusNode)) return null;
    return sel.getRangeAt(0);
  }

  function isCurrentSelectionInsideBody() {
    return currentSelectionRange() !== null;
  }

  function saveSelection() {
    const range = currentSelectionRange();
    if (range) savedRangeRef.current = range.cloneRange();
    return range;
  }

  function restoreSavedSelection() {
    if (typeof window === "undefined" || !bodyRef.current) return false;
    const savedRange = savedRangeRef.current?.cloneRange();
    if (!savedRange) return false;
    bodyRef.current.focus();
    const selection = window.getSelection();
    if (!selection) return false;
    try {
      selection.removeAllRanges();
      selection.addRange(savedRange);
      savedRangeRef.current = savedRange.cloneRange();
      return true;
    } catch {
      savedRangeRef.current = null;
      return false;
    }
  }

  function focusBody(position: "start" | "end" = "end") {
    if (typeof window === "undefined" || !bodyRef.current) return;
    const range = document.createRange();
    range.selectNodeContents(bodyRef.current);
    range.collapse(position === "start");
    const selection = window.getSelection();
    if (!selection) return;
    bodyRef.current.focus();
    selection.removeAllRanges();
    selection.addRange(range);
    savedRangeRef.current = range.cloneRange();
    refreshToolbar();
  }

  function selectWholeBody() {
    if (typeof window === "undefined" || !bodyRef.current) return;
    const range = document.createRange();
    range.selectNodeContents(bodyRef.current);
    const selection = window.getSelection();
    if (!selection) return;
    bodyRef.current.focus();
    selection.removeAllRanges();
    selection.addRange(range);
    savedRangeRef.current = range.cloneRange();
    refreshToolbar();
  }

  function ensureSafeLinks() {
    bodyRef.current?.querySelectorAll("a").forEach((anchor) => {
      const href = normalizeLinkHref(anchor.getAttribute("href") ?? "");
      if (href) anchor.setAttribute("href", href);
      anchor.setAttribute("target", "_blank");
      anchor.setAttribute("rel", "noopener");
    });
  }

  function syncBody() {
    if (!bodyRef.current) return;
    ensureSafeLinks();
    onChangeBody(bodyRef.current.innerHTML || "<p></p>");
  }

  function insertLinkElement(href: string, text: string, useSelection: boolean) {
    if (typeof window === "undefined") return false;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return false;

    const range = selection.getRangeAt(0);
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.target = "_blank";
    anchor.rel = "noopener";

    if (useSelection && !range.collapsed) {
      anchor.appendChild(range.extractContents());
    } else {
      range.deleteContents();
      anchor.textContent = text;
    }

    range.insertNode(anchor);

    const afterLink = document.createRange();
    afterLink.setStartAfter(anchor);
    afterLink.collapse(true);
    selection.removeAllRanges();
    selection.addRange(afterLink);
    savedRangeRef.current = afterLink.cloneRange();
    return true;
  }

  function closePopovers() {
    setHeadingOpen(false);
    setLinkPopover(null);
  }

  function exec(cmd: string, value?: string) {
    if (!restoreSavedSelection()) focusBody("end");
    document.execCommand(cmd, false, value);
    syncBody();
    saveSelection();
    refreshToolbar();
  }

  function applyHeading(tag: string) {
    if (!restoreSavedSelection()) focusBody("end");
    document.execCommand("formatBlock", false, tag.toUpperCase());
    syncBody();
    saveSelection();
    setHeadingOpen(false);
    refreshToolbar();
  }

  function currentBlockTag(): string {
    if (typeof document === "undefined") return "p";
    const sel = document.getSelection();
    if (!sel || sel.rangeCount === 0) return "p";
    let node: Node | null = sel.getRangeAt(0).startContainer;
    while (node && node !== bodyRef.current) {
      if (node.nodeType === 1) {
        const el = node as HTMLElement;
        const t = el.tagName.toLowerCase();
        if (["h1", "h2", "h3", "h4", "h5", "h6", "p"].includes(t)) return t;
      }
      node = node.parentNode;
    }
    return "p";
  }

  function openLink() {
    const range = saveSelection() ?? savedRangeRef.current;
    const selectedText = range?.toString() ?? "";
    setHeadingOpen(false);
    setLinkPopover({ url: "https://", text: selectedText, hasSelection: selectedText.trim().length > 0 });
  }

  function applyLink() {
    if (!linkPopover) return;
    const href = normalizeLinkHref(linkPopover.url);
    if (!href) {
      setLinkPopover(null);
      return;
    }

    const restored = restoreSavedSelection();
    if (!restored) focusBody("end");
    const text = linkPopover.text.trim() || href;
    if (!insertLinkElement(href, text, linkPopover.hasSelection && restored)) return;
    syncBody();
    saveSelection();
    setLinkPopover(null);
    refreshToolbar();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const meta = e.metaKey || e.ctrlKey;
    if (meta && e.key.toLowerCase() === "b") { e.preventDefault(); exec("bold"); return; }
    if (meta && e.key.toLowerCase() === "i") { e.preventDefault(); exec("italic"); return; }
    if (meta && e.key.toLowerCase() === "k") { e.preventDefault(); openLink(); return; }
    if (meta && e.key.toLowerCase() === "s") { e.preventDefault(); onSave(); return; }
    if (meta && e.key.toLowerCase() === "a") { e.preventDefault(); selectWholeBody(); return; }
    if (e.key === "Escape") { closePopovers(); return; }
    if (e.key === "Tab") { e.preventDefault(); }
  }

  function handleTitleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    const meta = e.metaKey || e.ctrlKey;
    if (meta && e.key.toLowerCase() === "s") {
      e.preventDefault();
      onSave();
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      focusBody("end");
      return;
    }
    if (e.key === "Escape") closePopovers();
  }

  function handlePaste(e: React.ClipboardEvent<HTMLDivElement>) {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    restoreSavedSelection();
    document.execCommand("insertText", false, text);
    syncBody();
    saveSelection();
    refreshToolbar();
  }

  function handleInput() {
    syncBody();
    saveSelection();
    refreshToolbar();
  }

  function handleBodyFocus() {
    saveSelection();
    refreshToolbar();
  }

  function handleTitleFocus() {
    savedRangeRef.current = null;
    closePopovers();
    refreshToolbar();
  }

  function handleLinkInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    const meta = e.metaKey || e.ctrlKey;
    if (meta && e.key.toLowerCase() === "s") {
      e.preventDefault();
      onSave();
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      applyLink();
    }
    if (e.key === "Escape") setLinkPopover(null);
  }

  function safeCommandState(command: string) {
    if (typeof document === "undefined" || !isCurrentSelectionInsideBody()) return false;
    try {
      return !!document.queryCommandState(command);
    } catch {
      return false;
    }
  }

  const activeTag = currentBlockTag();
  const boldOn = safeCommandState("bold");
  const italicOn = safeCommandState("italic");
  const headingLabel = HEADING_OPTIONS.find((o) => o.tag === activeTag)?.label ?? "Body";
  const saveLabel = saveStatus === "saving"
    ? "Saving..."
    : lastSavedAt
    ? `Saved ${format(lastSavedAt, "h:mm a")}`
    : "Saved";

  return (
    <div className="mx-auto max-w-[760px] px-4 py-6 sm:px-6 md:px-12 md:py-8">
      <div
        className="sticky top-0 z-20 -mx-4 px-4 py-2 sm:-mx-6 sm:px-6 md:-mx-12 md:px-12"
        style={{ background: "#FFFFFF", borderBottom: "1px solid #F0EFE9" }}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <span className="relative inline-flex mynotes-toolbar-tip">
            <button
              onMouseDown={(e) => { e.preventDefault(); saveSelection(); }}
              onClick={() => setHeadingOpen((o) => !o)}
              className="mynotes-control flex items-center gap-1 px-3 py-1.5 rounded-full"
              style={{ background: "#F8F8F8", color: "#1C1C1C", fontSize: 12, fontWeight: 500 }}
              title="Text style"
              aria-haspopup="menu"
              aria-expanded={headingOpen}
            >
              {headingLabel}
              <ChevronDown size={12} />
            </button>
            {headingOpen && (
              <div
                role="menu"
                className="absolute left-0 top-full mt-1 rounded-xl py-1.5 z-30"
                style={{ background: "#fff", boxShadow: "0 4px 16px rgba(0,0,0,0.08)", minWidth: 160 }}
              >
                {HEADING_OPTIONS.map((opt) => (
                  <button
                    key={opt.tag}
                    role="menuitemradio"
                    aria-checked={activeTag === opt.tag}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyHeading(opt.tag)}
                    className="mynotes-control w-full text-left px-3 py-1.5"
                    style={{
                      fontSize: 13,
                      color: "#1C1C1C",
                      fontWeight: activeTag === opt.tag ? 700 : 400,
                      background: activeTag === opt.tag ? "#FAF8F2" : "transparent",
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
            <span className="mynotes-tooltip-label" aria-hidden="true">Text style</span>
          </span>

          <ToolbarButton
            onClick={() => exec("bold")}
            active={boldOn}
            label="Bold"
            shortcut="Ctrl/Cmd+B"
            onPreserveSelection={saveSelection}
          >
            <Bold size={13} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => exec("italic")}
            active={italicOn}
            label="Italic"
            shortcut="Ctrl/Cmd+I"
            onPreserveSelection={saveSelection}
          >
            <Italic size={13} />
          </ToolbarButton>
          <ToolbarButton
            onClick={openLink}
            active={false}
            isToggle={false}
            label="Link"
            shortcut="Ctrl/Cmd+K"
            onPreserveSelection={saveSelection}
          >
            <LinkIcon size={13} />
          </ToolbarButton>

          <div
            className="min-h-8 flex items-center gap-2 rounded-full px-2.5 sm:ml-auto"
            style={{ background: "#F8F8F8", color: "#6F6F6F", fontSize: 12, fontWeight: 500 }}
            aria-live="polite"
            title="Ctrl/Cmd+S saves immediately"
          >
            <span
              className="inline-block rounded-full"
              style={{ width: 6, height: 6, background: saveStatus === "saving" ? "#F5A623" : "#CACACA" }}
            />
            {saveLabel}
          </div>

          {linkPopover && (
            <div
              className="mynotes-link-popover flex w-full flex-wrap items-center gap-2 rounded-xl px-3 py-2 sm:w-auto sm:rounded-full sm:pl-3 sm:pr-1 sm:py-1"
              style={{ background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #F0EFE9" }}
            >
              {!linkPopover.hasSelection && (
                <input
                  autoFocus
                  value={linkPopover.text}
                  onChange={(e) => setLinkPopover({ ...linkPopover, text: e.target.value })}
                  onKeyDown={handleLinkInputKeyDown}
                  placeholder="Text"
                  className="mynotes-popover-input outline-none"
                  style={{ fontSize: 12, width: 90, color: "#1C1C1C" }}
                />
              )}
              <input
                autoFocus={linkPopover.hasSelection}
                value={linkPopover.url}
                onChange={(e) => setLinkPopover({ ...linkPopover, url: e.target.value })}
                onKeyDown={handleLinkInputKeyDown}
                placeholder="https://"
                className="mynotes-popover-input outline-none"
                style={{ fontSize: 12, width: 180, color: "#1C1C1C" }}
              />
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={applyLink}
                className="mynotes-control px-3 py-1 rounded-full"
                style={{ background: "#F5A623", color: "#fff", fontSize: 11, fontWeight: 500 }}
              >
                Add
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 text-center" style={{ fontSize: 12, color: "#6F6F6F" }}>
        {format(new Date(note.updatedAt), "MMMM d, yyyy 'at' h:mm a")}
      </div>

      <input
        ref={titleRef}
        value={note.title}
        onChange={(e) => onChangeTitle(e.target.value)}
        onKeyDown={handleTitleKeyDown}
        onFocus={handleTitleFocus}
        placeholder="Title"
        className="mynotes-title w-full mt-4 bg-transparent outline-none"
        style={{ fontSize: 34, fontWeight: 700, color: "#1C1C1C", lineHeight: 1.25 }}
      />

      <div
        ref={bodyRef}
        className="mt-4 mynotes-body"
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onFocus={handleBodyFocus}
        onMouseUp={() => { saveSelection(); refreshToolbar(); }}
        onKeyUp={() => { saveSelection(); refreshToolbar(); }}
        dangerouslySetInnerHTML={{ __html: initialBodyHtml.current }}
        role="textbox"
        aria-multiline="true"
        aria-label="Note body"
        style={{
          minHeight: 360,
          outline: "none",
          fontSize: 14,
          lineHeight: 1.65,
          color: "#1C1C1C",
        }}
      />

      <style>{`
        .mynotes-control {
          transition: background 160ms ease, color 160ms ease, outline-color 160ms ease;
        }
        .mynotes-control:focus-visible,
        .mynotes-title:focus-visible,
        .mynotes-body:focus-visible,
        .mynotes-popover-input:focus-visible {
          outline: 2px solid #F5A623;
          outline-offset: 2px;
        }
        .mynotes-title::placeholder,
        .mynotes-popover-input::placeholder {
          color: #6F6F6F;
          opacity: 1;
        }
        .mynotes-body {
          caret-color: #1C1C1C;
        }
        .mynotes-body::selection,
        .mynotes-body *::selection {
          background: #FFE9C2;
        }
        .mynotes-body p { margin: 0 0 12px; }
        .mynotes-body h1 { font-size: 28px; font-weight: 700; line-height: 1.25; margin: 18px 0 10px; }
        .mynotes-body h2 { font-size: 24px; font-weight: 700; line-height: 1.3;  margin: 16px 0 8px; }
        .mynotes-body h3 { font-size: 20px; font-weight: 700; line-height: 1.35; margin: 14px 0 6px; }
        .mynotes-body h4 { font-size: 17px; font-weight: 700; line-height: 1.4;  margin: 12px 0 6px; }
        .mynotes-body h5 { font-size: 15px; font-weight: 700; line-height: 1.4;  margin: 10px 0 4px; }
        .mynotes-body h6 { font-size: 13px; font-weight: 700; line-height: 1.4;  margin: 10px 0 4px; text-transform: uppercase; letter-spacing: 0.04em; }
        .mynotes-body a { color: #F5A623; text-decoration: underline; }
        .mynotes-body b, .mynotes-body strong { font-weight: 700; }
        .mynotes-body i, .mynotes-body em { font-style: italic; }
        .mynotes-toolbar-tip {
          position: relative;
        }
        .mynotes-tooltip-label {
          position: absolute;
          left: 50%;
          bottom: calc(100% + 8px);
          transform: translate(-50%, 4px);
          opacity: 0;
          pointer-events: none;
          white-space: nowrap;
          border-radius: 6px;
          background: #1C1C1C;
          color: #FFFFFF;
          padding: 4px 8px;
          font-size: 11px;
          line-height: 1.4;
          font-weight: 500;
          z-index: 40;
          transition: opacity 160ms ease, transform 160ms ease;
        }
        .mynotes-toolbar-tip:hover > .mynotes-tooltip-label,
        .mynotes-toolbar-tip:focus-within > .mynotes-tooltip-label {
          opacity: 1;
          transform: translate(-50%, 0);
        }
        @media (prefers-reduced-motion: reduce) {
          .mynotes-control,
          .mynotes-tooltip-label {
            transition: none;
          }
        }
      `}</style>
    </div>
  );
}

function ToolbarButton({
  active,
  isToggle = true,
  onClick,
  children,
  label,
  shortcut,
  onPreserveSelection,
  ...rest
}: {
  active?: boolean;
  isToggle?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  label: string;
  shortcut: string;
  onPreserveSelection?: () => void;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <span className="relative inline-flex mynotes-toolbar-tip">
      <button
        {...rest}
        type="button"
        aria-label={`${label} (${shortcut})`}
        aria-pressed={isToggle ? !!active : undefined}
        data-active={active ? "true" : "false"}
        title={`${label} (${shortcut})`}
        onMouseDown={(e) => {
          e.preventDefault();
          onPreserveSelection?.();
        }}
        onClick={onClick}
        className="mynotes-control w-8 h-8 rounded-full flex items-center justify-center"
        style={{ background: active ? "#1C1C1C" : "#F8F8F8", color: active ? "#fff" : "#1C1C1C" }}
      >
        {children}
      </button>
      <span className="mynotes-tooltip-label" aria-hidden="true">{label} ({shortcut})</span>
    </span>
  );
}
