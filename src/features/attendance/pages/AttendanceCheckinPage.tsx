import { useMemo, useState } from "react";
import { CheckCircle2, KeyRound, QrCode, ShieldCheck } from "lucide-react";

import { InlineNotice, LoadingLabel, StatusBadge } from "../../../components/common/Feedback";
import type { ToastMessage } from "../../../components/common/Feedback";
import { useAppData } from "../../../context/AppDataContext";
import { formatDateTime } from "../../../utils/format";
import { StudentAttendanceQr } from "../components/StudentAttendanceQr";

export function AttendanceCheckinPage({
  onBack,
  onNotify,
}: {
  onBack: () => void;
  onNotify?: (toast: Omit<ToastMessage, "id">) => void;
}) {
  const { state, submitAttendance } = useAppData();
  const [tab, setTab] = useState<"qr" | "code">("qr");
  const sessions = useMemo(
    () =>
      state.events
        .filter((event) => !["Cancelled", "Draft"].includes(event.status))
        .sort((a, b) => +new Date(a.date) - +new Date(b.date)),
    [state.events]
  );
  const [selectedSessionId, setSelectedSessionId] = useState(sessions[0]?.id ?? "");
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [codeSuccess, setCodeSuccess] = useState<string | null>(null);

  async function handleCodeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSessionId) {
      setCodeError("Please select a session to check in.");
      return;
    }
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode || cleanCode.length < 4) {
      setCodeError("Please enter a valid attendance code (at least 4 characters).");
      return;
    }

    setSubmitting(true);
    setCodeError(null);
    setCodeSuccess(null);

    const result = await submitAttendance(selectedSessionId, cleanCode, "Code");
    setSubmitting(false);

    if (result.ok) {
      setCodeSuccess(result.message || "Attendance recorded successfully (+40 pts).");
      setCode("");
      onNotify?.({
        tone: "success",
        title: "Attendance checked in",
        description: result.message || "Your attendance has been submitted.",
      });
    } else {
      setCodeError(result.message || "Invalid attendance code or check-in window closed.");
      onNotify?.({
        tone: "error",
        title: "Check-in failed",
        description: result.message,
      });
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="section-kicker">Attendance check-in</div>
          <h1 className="page-heading">Check in to Session</h1>
          <p className="page-description">
            Choose your check-in method: show your personal QR to an administrator or enter the session code.
          </p>
        </div>
        <button className="secondary-button" type="button" onClick={onBack}>
          View attendance history
        </button>
      </header>

      {/* Workflow Tabs */}
      <div className="mt-6 flex gap-2 border-b border-[#E8E6DF] pb-3">
        <button
          type="button"
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
            tab === "qr"
              ? "bg-[#1C1C1C] text-white shadow-sm"
              : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
          onClick={() => setTab("qr")}
        >
          <QrCode size={16} /> Option 1: Show Personal QR
        </button>
        <button
          type="button"
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
            tab === "code"
              ? "bg-[#1C1C1C] text-white shadow-sm"
              : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
          onClick={() => setTab("code")}
        >
          <KeyRound size={16} /> Option 2: Enter Session Code
        </button>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[1fr_330px]">
        <section className="rounded-xl bg-white p-5 demo-card">
          {tab === "qr" ? (
            <StudentAttendanceQr onNotify={onNotify} />
          ) : (
            <form onSubmit={handleCodeSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1" htmlFor="session-select">
                  Select Session
                </label>
                <select
                  id="session-select"
                  className="w-full rounded-xl border border-gray-300 p-3 text-sm focus:border-amber-500 focus:outline-none"
                  value={selectedSessionId}
                  onChange={(e) => {
                    setSelectedSessionId(e.target.value);
                    setCodeError(null);
                    setCodeSuccess(null);
                  }}
                  disabled={submitting || !sessions.length}
                >
                  {sessions.length ? (
                    sessions.map((session) => (
                      <option key={session.id} value={session.id}>
                        {session.title} — {formatDateTime(session.date)}
                      </option>
                    ))
                  ) : (
                    <option value="">No active sessions available</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1" htmlFor="attendance-code-input">
                  Attendance Code
                </label>
                <input
                  id="attendance-code-input"
                  type="text"
                  className="w-full rounded-xl border border-gray-300 p-3 text-sm font-mono uppercase tracking-wider focus:border-amber-500 focus:outline-none"
                  placeholder="e.g. CLINIC2026"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  disabled={submitting || !sessions.length}
                  maxLength={32}
                  autoComplete="off"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Enter the code announced by your tutor or administrator during the session.
                </p>
              </div>

              {codeError && (
                <InlineNotice tone="error" title="Check-in failed">
                  {codeError}
                </InlineNotice>
              )}

              {codeSuccess && (
                <InlineNotice tone="success" title="Attendance recorded">
                  {codeSuccess}
                </InlineNotice>
              )}

              <button
                type="submit"
                className="primary-button w-full justify-center py-3"
                disabled={submitting || !sessions.length || !code.trim()}
              >
                {submitting ? (
                  <LoadingLabel label="Verifying code with server..." />
                ) : (
                  <>
                    <CheckCircle2 size={16} /> Submit Attendance Code
                  </>
                )}
              </button>
            </form>
          )}
        </section>

        <aside className="rounded-xl bg-[#1C1C1C] p-5 text-white">
          {tab === "qr" ? (
            <>
              <QrCode size={28} color="#F5A623" />
              <h2 className="mt-4 text-lg font-bold">Option 1: Personal QR</h2>
              <ol className="mt-4 space-y-3 text-sm leading-6 text-white/70">
                <li>1. Open this personal QR when you arrive.</li>
                <li>2. Show this code to the administrator recording attendance.</li>
                <li>3. The administrator scans and confirms your check-in (+40 pts).</li>
              </ol>
              <div className="mt-6 flex gap-3 rounded-xl bg-white/10 p-4 text-xs leading-5 text-white/70">
                <ShieldCheck className="shrink-0 text-[#F5A623]" size={20} />
                <p>
                  Your attendance QR contains a secure, server-issued 5-minute single-use token. Generating a new QR invalidates the previous one.
                </p>
              </div>
            </>
          ) : (
            <>
              <KeyRound size={28} color="#F5A623" />
              <h2 className="mt-4 text-lg font-bold">Option 2: Session Code</h2>
              <ol className="mt-4 space-y-3 text-sm leading-6 text-white/70">
                <li>1. Obtain the session code announced by the administrator.</li>
                <li>2. Select your session from the list.</li>
                <li>3. Enter the code and submit within the session check-in window.</li>
              </ol>
              <div className="mt-6 flex gap-3 rounded-xl bg-white/10 p-4 text-xs leading-5 text-white/70">
                <ShieldCheck className="shrink-0 text-[#F5A623]" size={20} />
                <p>
                  Attendance codes are verified directly by PostgreSQL and are only valid during the active session check-in window.
                </p>
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
