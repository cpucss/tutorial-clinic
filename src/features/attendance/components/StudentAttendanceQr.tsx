import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, CameraOff, CheckCircle2, QrCode, RefreshCw, ScanLine } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

import { InlineNotice, StatusBadge } from "../../../components/common/Feedback";
import type { ToastMessage } from "../../../components/common/Feedback";
import { useAppData } from "../../../context/AppDataContext";
import { formatDateTime } from "../../../utils/format";
import {
  buildStudentAttendanceQrPayload,
  parseStudentAttendanceQrPayload,
  type StudentAttendanceQrPayload,
} from "../qr";

const QR_LIFETIME_MS = 5 * 60 * 1000;

type CameraState = "idle" | "starting" | "active" | "unsupported" | "denied";
type BarcodeDetectorLike = { detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue: string }>> };
type BarcodeDetectorConstructor = new (options: { formats: string[] }) => BarcodeDetectorLike;

function issueCredential(userId: string, studentId: string): StudentAttendanceQrPayload {
  const issuedAt = Date.now();
  return {
    userId,
    studentId,
    nonce: crypto.randomUUID(),
    issuedAt,
    expiresAt: issuedAt + QR_LIFETIME_MS,
  };
}

export function StudentAttendanceQr({ onNotify }: { onNotify?: (toast: Omit<ToastMessage, "id">) => void }) {
  const { currentUser } = useAppData();
  const backendUserId = currentUser?.authUserId;
  const [credential, setCredential] = useState(() => backendUserId && currentUser ? issueCredential(backendUserId, currentUser.studentId) : null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (credential && now >= credential.expiresAt && backendUserId && currentUser) {
      setCredential(issueCredential(backendUserId, currentUser.studentId));
    }
  }, [backendUserId, credential, currentUser, now]);

  if (!currentUser || currentUser.role === "admin") return null;
  if (!backendUserId || !credential) {
    return <InlineNotice tone="warning" title="Sign in again">Sign out and sign in again so your Supabase identity can be added to the attendance QR.</InlineNotice>;
  }

  const secondsRemaining = Math.max(0, Math.ceil((credential.expiresAt - now) / 1000));
  const qrValue = buildStudentAttendanceQrPayload(credential);

  function refresh() {
    const next = issueCredential(backendUserId!, currentUser!.studentId);
    setCredential(next);
    setNow(Date.now());
    onNotify?.({ tone: "info", title: "New QR generated", description: "Your previous attendance QR has been replaced." });
  }

  return (
    <div className="qr-mode-content">
      <div className="qr-generator-summary">
        <div><strong>{currentUser.name}</strong><span>{currentUser.studentId}</span></div>
        <StatusBadge status={`${Math.floor(secondsRemaining / 60)}:${String(secondsRemaining % 60).padStart(2, "0")} remaining`} />
      </div>
      <div className="qr-code-panel qr-mode-code-panel">
        <QRCodeSVG value={qrValue} size={240} level="M" marginSize={2} title={`Attendance QR for ${currentUser.name}`} />
      </div>
      <InlineNotice tone="info" title="Show this QR to an administrator">The administrator will select the session, scan this code, and record your attendance.</InlineNotice>
      <div className="qr-mode-actions">
        <button className="secondary-button" type="button" onClick={refresh}><RefreshCw size={15} /> Generate new QR</button>
      </div>
    </div>
  );
}

export function AdminStudentQrScanner({ onNotify }: { onNotify?: (toast: Omit<ToastMessage, "id">) => void }) {
  const { state, recordStudentQrAttendance } = useAppData();
  const sessions = useMemo(() => state.events
    .filter((event) => !["Cancelled", "Draft"].includes(event.status))
    .sort((a, b) => +new Date(a.date) - +new Date(b.date)), [state.events]);
  const [eventId, setEventId] = useState(sessions[0]?.id ?? "");
  const [payload, setPayload] = useState<StudentAttendanceQrPayload | null>(null);
  const [cameraState, setCameraState] = useState<CameraState>("idle");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ tone: "info" | "success" | "error" | "warning"; title: string; body: string }>({
    tone: "info",
    title: "Scanner ready",
    body: "Select a session, then scan the student's personal attendance QR.",
  });
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanTimer = useRef<number | null>(null);
  const selectedEvent = state.events.find((event) => event.id === eventId);
  const student = payload ? state.users.find((user) => user.studentId.toUpperCase() === payload.studentId && user.role !== "admin") : null;
  const duplicate = Boolean(student && state.attendance.some((record) => record.eventId === eventId && record.userId === student.id && record.status !== "Rejected"));

  function releaseCamera(updateState = true) {
    if (scanTimer.current) window.clearTimeout(scanTimer.current);
    scanTimer.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    if (updateState) setCameraState("idle");
  }

  useEffect(() => () => releaseCamera(false), []);

  useEffect(() => {
    if (!eventId && sessions[0]) setEventId(sessions[0].id);
  }, [eventId, sessions]);

  function recognize(value: string): boolean {
    const parsed = parseStudentAttendanceQrPayload(value);
    if (!parsed) {
      setNotice({ tone: "error", title: "Unsupported QR", body: "Scan a personal student QR generated by Tutorial Clinic." });
      return false;
    }
    const now = Date.now();
    if (parsed.issuedAt > now + 30_000 || parsed.expiresAt - parsed.issuedAt > QR_LIFETIME_MS) {
      releaseCamera();
      setNotice({ tone: "error", title: "Invalid QR lifetime", body: "Ask the student to generate a new attendance QR from the app." });
      return true;
    }
    if (now > parsed.expiresAt) {
      releaseCamera();
      setNotice({ tone: "error", title: "QR expired", body: "Ask the student to generate a new attendance QR." });
      return true;
    }
    const rosterStudent = state.users.find((user) => user.studentId.toUpperCase() === parsed.studentId && user.role !== "admin" && user.active);
    if (!rosterStudent) {
      releaseCamera();
      setNotice({ tone: "error", title: "Student not found", body: "The scanned student is not in the authenticated roster." });
      return true;
    }
    if (rosterStudent.authUserId && rosterStudent.authUserId !== parsed.userId) {
      releaseCamera();
      setNotice({ tone: "error", title: "Identity mismatch", body: "The QR does not match this student's Supabase profile." });
      return true;
    }
    releaseCamera();
    setPayload(parsed);
    setNotice({ tone: "success", title: "Student QR recognized", body: "Review the student and session, then record attendance." });
    return true;
  }

  async function startCamera() {
    const Detector = (window as unknown as { BarcodeDetector?: BarcodeDetectorConstructor }).BarcodeDetector;
    if (!navigator.mediaDevices?.getUserMedia || !Detector) {
      setCameraState("unsupported");
      setNotice({ tone: "warning", title: "Scanner unavailable", body: "Use a Chromium browser with camera access on HTTPS or localhost." });
      return;
    }
    setCameraState("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
      setCameraState("active");
      const detector = new Detector({ formats: ["qr_code"] });
      const scan = async () => {
        if (!videoRef.current || !streamRef.current) return;
        try {
          const results = await detector.detect(videoRef.current);
          if (results[0]?.rawValue && recognize(results[0].rawValue)) return;
        } catch { /* Keep scanning while the camera focuses. */ }
        scanTimer.current = window.setTimeout(scan, 350);
      };
      scan();
    } catch {
      releaseCamera();
      setCameraState("denied");
      setNotice({ tone: "warning", title: "Camera access blocked", body: "Allow camera access in the browser settings, then try again." });
    }
  }

  function reset() {
    setPayload(null);
    setNotice({ tone: "info", title: "Scanner ready", body: "Select a session, then scan the student's personal attendance QR." });
  }

  async function confirm() {
    if (!payload || !eventId) return;
    if (Date.now() > payload.expiresAt) {
      setNotice({ tone: "error", title: "QR expired", body: "Ask the student to generate a new attendance QR." });
      return;
    }
    setSaving(true);
    const result = await recordStudentQrAttendance(eventId, payload.studentId, payload.userId);
    setSaving(false);
    const next = result.ok
      ? { tone: "success" as const, title: "Attendance recorded", body: result.message ?? "The student was checked in." }
      : { tone: "error" as const, title: "Attendance not recorded", body: result.message };
    setNotice(next);
    onNotify?.({ tone: next.tone, title: next.title, description: next.body });
  }

  return (
    <div className="qr-mode-content">
      <label className="form-field">
        <span>Session</span>
        <select value={eventId} onChange={(event) => { setEventId(event.target.value); setPayload(null); }}>
          {sessions.map((event) => <option key={event.id} value={event.id}>{event.title} - {formatDateTime(event.date)}</option>)}
        </select>
      </label>
      {!sessions.length ? <InlineNotice tone="warning" title="No sessions available">Create or publish a session before scanning attendance.</InlineNotice> : payload && student ? (
        <div className="qr-scan-result">
          <span className="qr-result-icon"><CheckCircle2 /></span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2"><h3>{student.name}</h3><StatusBadge status={duplicate ? "Already recorded" : "Identity verified"} /></div>
            <p>{student.studentId}</p>
            <code>{selectedEvent?.title}</code>
          </div>
        </div>
      ) : (
        <div className="camera-panel qr-mode-camera">
          <video ref={videoRef} muted playsInline aria-label="Student attendance QR scanner camera preview" />
          {cameraState !== "active" && <div className="camera-placeholder">
            {cameraState === "unsupported" || cameraState === "denied" ? <CameraOff /> : <Camera />}
            <strong>{cameraState === "unsupported" ? "QR scanning is not supported" : cameraState === "denied" ? "Camera permission was not granted" : "Scan student QR"}</strong>
            <p>Ask the student to open Attendance and show their personal QR.</p>
            {cameraState === "idle" && <button className="primary-button" type="button" onClick={startCamera}><ScanLine size={15} /> Start scanner</button>}
            {cameraState === "starting" && <StatusBadge status="Starting camera" />}
          </div>}
          {cameraState === "active" && <><span className="qr-scan-frame" aria-hidden="true" /><button className="secondary-button camera-stop" type="button" onClick={() => releaseCamera()}>Stop camera</button></>}
        </div>
      )}
      <InlineNotice tone={notice.tone} title={notice.title}>{notice.body}</InlineNotice>
      <div className="qr-mode-actions">
        {payload && <button className="secondary-button" type="button" onClick={reset}>Scan another</button>}
        {payload && <button className="primary-button" type="button" onClick={confirm} disabled={duplicate || saving || !eventId}><QrCode size={15} /> {saving ? "Recording..." : "Record attendance"}</button>}
      </div>
    </div>
  );
}
