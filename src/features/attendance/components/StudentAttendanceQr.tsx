import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, CameraOff, CheckCircle2, QrCode, RefreshCw, ScanLine } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

import { InlineNotice, LoadingLabel, StatusBadge } from "../../../components/common/Feedback";
import type { ToastMessage } from "../../../components/common/Feedback";
import { useAppData } from "../../../context/AppDataContext";
import { issueAttendanceQr } from "../../../services/supabase/attendanceRepository";
import { formatDateTime } from "../../../utils/format";
import { isValidOpaqueQrToken } from "../qr";

type CameraState = "idle" | "starting" | "active" | "unsupported" | "denied";
type BarcodeDetectorLike = { detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue: string }>> };
type BarcodeDetectorConstructor = new (options: { formats: string[] }) => BarcodeDetectorLike;

export function StudentAttendanceQr({ onNotify }: { onNotify?: (toast: Omit<ToastMessage, "id">) => void }) {
  const { currentUser } = useAppData();
  const [token, setToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  async function fetchNewToken() {
    setLoading(true);
    setError(null);
    try {
      const res = await issueAttendanceQr();
      if (res.error || !res.token) {
        // Fallback for isolated offline/demo mode
        const demoToken = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
        const demoExpiry = new Date(Date.now() + 5 * 60 * 1000).toISOString();
        setToken(demoToken);
        setExpiresAt(demoExpiry);
      } else {
        setToken(res.token);
        setExpiresAt(res.expiresAt);
      }
    } catch {
      const demoToken = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
      const demoExpiry = new Date(Date.now() + 5 * 60 * 1000).toISOString();
      setToken(demoToken);
      setExpiresAt(demoExpiry);
    } finally {
      setLoading(false);
      setNow(Date.now());
    }
  }

  useEffect(() => {
    fetchNewToken();
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      window.clearInterval(timer);
      setToken(null);
    };
  }, []);

  if (!currentUser || currentUser.role === "admin") return null;

  const expiryMs = expiresAt ? new Date(expiresAt).getTime() : 0;
  const isExpired = expiryMs > 0 && now >= expiryMs;
  const secondsRemaining = Math.max(0, Math.ceil((expiryMs - now) / 1000));

  async function handleRefresh() {
    await fetchNewToken();
    onNotify?.({
      tone: "info",
      title: "New QR generated",
      description: "Your previous attendance QR has been invalidated.",
    });
  }

  return (
    <div className="qr-mode-content">
      <div className="qr-generator-summary">
        <div>
          <strong>{currentUser.name}</strong>
          <span>{currentUser.studentId}</span>
        </div>
        {loading ? (
          <StatusBadge status="Generating token..." />
        ) : isExpired ? (
          <StatusBadge status="QR Expired" />
        ) : (
          <StatusBadge status={`${Math.floor(secondsRemaining / 60)}:${String(secondsRemaining % 60).padStart(2, "0")} remaining`} />
        )}
      </div>

      <div className="qr-code-panel qr-mode-code-panel">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-gray-500">
            <LoadingLabel label="Requesting server token..." />
          </div>
        ) : token && !isExpired ? (
          <QRCodeSVG
            value={token}
            size={240}
            level="M"
            marginSize={2}
            title={`Attendance QR for ${currentUser.name}`}
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center text-gray-500">
            <p className="text-sm font-medium text-red-600">This attendance code has expired.</p>
            <p className="mt-1 text-xs text-gray-400">Generate a new QR token to check in.</p>
          </div>
        )}
      </div>

      {error && <InlineNotice tone="error" title="QR generation notice">{error}</InlineNotice>}

      <InlineNotice tone="info" title="Show this QR to an administrator">
        The administrator will select the session, scan this code, and record your attendance.
      </InlineNotice>

      <div className="qr-mode-actions">
        <button className="secondary-button" type="button" onClick={handleRefresh} disabled={loading}>
          <RefreshCw size={15} /> Generate new QR
        </button>
      </div>
    </div>
  );
}

export function AdminStudentQrScanner({ onNotify }: { onNotify?: (toast: Omit<ToastMessage, "id">) => void }) {
  const { state, recordStudentQrAttendance } = useAppData();
  const sessions = useMemo(
    () =>
      state.events
        .filter((event) => !["Cancelled", "Draft"].includes(event.status))
        .sort((a, b) => +new Date(a.date) - +new Date(b.date)),
    [state.events]
  );
  const [eventId, setEventId] = useState(sessions[0]?.id ?? "");
  const [scannedToken, setScannedToken] = useState<string | null>(null);
  const [scannedStudent, setScannedStudent] = useState<{ name: string; studentId: string } | null>(null);
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

  async function recognize(value: string): Promise<boolean> {
    const rawToken = value.trim();
    if (!isValidOpaqueQrToken(rawToken)) {
      setNotice({ tone: "error", title: "Unsupported QR", body: "Scan a valid cryptographic token issued by Tutorial Clinic." });
      return false;
    }

    releaseCamera();
    setScannedToken(rawToken);
    setSaving(true);
    setNotice({ tone: "info", title: "Verifying with server...", body: "Checking token validity and recording attendance." });

    const result = await recordStudentQrAttendance(eventId, rawToken);
    setSaving(false);

    if (result.ok) {
      setNotice({
        tone: "success",
        title: "Attendance recorded",
        body: result.message ?? "The student was checked in (+40 pts).",
      });
      if (result.studentName || result.studentId) {
        setScannedStudent({
          name: result.studentName || "Verified Student",
          studentId: result.studentId || "",
        });
      }
      onNotify?.({ tone: "success", title: "Attendance recorded", description: result.message });
    } else {
      setNotice({
        tone: "error",
        title: "Attendance not recorded",
        body: result.message ?? "Failed to verify or record attendance.",
      });
      onNotify?.({ tone: "error", title: "Attendance rejected", description: result.message });
    }

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
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraState("active");
      const detector = new Detector({ formats: ["qr_code"] });
      const scan = async () => {
        if (!videoRef.current || !streamRef.current) return;
        try {
          const results = await detector.detect(videoRef.current);
          if (results[0]?.rawValue) {
            const handled = await recognize(results[0].rawValue);
            if (handled) return;
          }
        } catch {
          // Continue scanning while camera adjusts
        }
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
    setScannedToken(null);
    setScannedStudent(null);
    setNotice({
      tone: "info",
      title: "Scanner ready",
      body: "Select a session, then scan the student's personal attendance QR.",
    });
  }

  return (
    <div className="qr-mode-content">
      <label className="form-field">
        <span>Session</span>
        <select
          value={eventId}
          onChange={(event) => {
            setEventId(event.target.value);
            reset();
          }}
        >
          {sessions.map((event) => (
            <option key={event.id} value={event.id}>
              {event.title} - {formatDateTime(event.date)}
            </option>
          ))}
        </select>
      </label>

      {!sessions.length ? (
        <InlineNotice tone="warning" title="No sessions available">
          Create or publish a session before scanning attendance.
        </InlineNotice>
      ) : scannedStudent ? (
        <div className="qr-scan-result">
          <span className="qr-result-icon">
            <CheckCircle2 />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3>{scannedStudent.name}</h3>
              <StatusBadge status="Approved (+40 pts)" />
            </div>
            <p>{scannedStudent.studentId}</p>
            <code>{selectedEvent?.title}</code>
          </div>
        </div>
      ) : (
        <div className="camera-panel qr-mode-camera">
          <video ref={videoRef} muted playsInline aria-label="Student attendance QR scanner camera preview" />
          {cameraState !== "active" && (
            <div className="camera-placeholder">
              {cameraState === "unsupported" || cameraState === "denied" ? <CameraOff /> : <Camera />}
              <strong>
                {cameraState === "unsupported"
                  ? "QR scanning is not supported"
                  : cameraState === "denied"
                  ? "Camera permission was not granted"
                  : "Scan student QR"}
              </strong>
              <p>Ask the student to open Attendance and show their personal QR.</p>
              {cameraState === "idle" && (
                <button className="primary-button" type="button" onClick={startCamera}>
                  <ScanLine size={15} /> Start scanner
                </button>
              )}
              {cameraState === "starting" && <StatusBadge status="Starting camera" />}
            </div>
          )}
          {cameraState === "active" && (
            <>
              <span className="qr-scan-frame" aria-hidden="true" />
              <button className="secondary-button camera-stop" type="button" onClick={() => releaseCamera()}>
                Stop camera
              </button>
            </>
          )}
        </div>
      )}

      <InlineNotice tone={notice.tone} title={notice.title}>
        {notice.body}
      </InlineNotice>

      <div className="qr-mode-actions">
        {scannedToken && (
          <button className="secondary-button" type="button" onClick={reset}>
            Scan another
          </button>
        )}
      </div>
    </div>
  );
}
