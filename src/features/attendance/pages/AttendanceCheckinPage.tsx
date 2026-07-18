import { useState } from "react";
import { CheckCircle2, Clock, KeyRound, MapPin, QrCode, ScanLine } from "lucide-react";

import { events } from "../../../mock";
import { InlineNotice, StatusBadge } from "../../../components/common/Feedback";
import type { ToastMessage } from "../../../components/common/Feedback";

type Method = "code" | "qr";
type NoticeTone = "info" | "success" | "error" | "warning";

export function AttendanceCheckinPage({ onNotify }: { onNotify?: (toast: Omit<ToastMessage, "id">) => void }) {
  const [method, setMethod] = useState<Method>("code");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("Waiting for attendance confirmation.");
  const [statusTone, setStatusTone] = useState<NoticeTone>("info");

  const session = events.find((event) => new Date(event.date) >= new Date()) ?? events[0];
  const date = new Date(session.date);

  function submitAttendance() {
    if (method === "code" && code.trim().length < 4) {
      setStatus("Enter the attendance code shared by the facilitator.");
      setStatusTone("error");
      onNotify?.({
        tone: "error",
        title: "Attendance code required",
        description: "Enter at least 4 characters from the facilitator code.",
      });
      return;
    }

    setStatus("Attendance confirmed. Your check-in is pending admin approval.");
    setStatusTone("success");
    onNotify?.({
      tone: "success",
      title: "Attendance submitted",
      description: "Your check-in is waiting for admin approval.",
    });
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        <div className="grid grid-cols-1 xl:grid-cols-[310px_1fr] gap-5 items-start">
          <aside className="rounded-xl p-5" style={{ background: "#FFFFFF", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
            <div style={{ fontSize: 12, color: "#6F6F6F" }}>Attendance</div>
            <h1 className="mt-1" style={{ fontSize: 30, fontWeight: 700, color: "#1C1C1C", lineHeight: 1.2 }}>
              Check in
            </h1>
            <p className="mt-2" style={{ fontSize: 13, color: "#6F6F6F", lineHeight: 1.55 }}>
              Use the session code or scan the QR code shown by the facilitator.
            </p>

            <div className="mt-5 rounded-xl p-4" style={{ background: "#FAF8F2" }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#1C1C1C", lineHeight: 1.35 }}>{session.title}</div>
              <div className="mt-3 flex flex-col gap-2">
                <Detail icon={<Clock size={15} />} label={date.toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })} />
                <Detail icon={<MapPin size={15} />} label={session.venue} />
                <Detail icon={<CheckCircle2 size={15} />} label={`${session.rsvps}/${session.capacity} students reserved`} />
              </div>
            </div>
          </aside>

          <main className="rounded-xl p-6" style={{ background: "#FFFFFF", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
              <div>
                <h2 style={{ fontSize: 32, fontWeight: 700, color: "#1C1C1C", lineHeight: 1.25 }}>Record attendance</h2>
                <p className="mt-2" style={{ fontSize: 14, color: "#6F6F6F", lineHeight: 1.65 }}>
                  Confirm your presence while the session is active.
                </p>
              </div>
              <StatusBadge status="Live session" />
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <TabButton active={method === "code"} icon={<KeyRound size={14} />} label="Attendance code" onClick={() => setMethod("code")} />
              <TabButton active={method === "qr"} icon={<QrCode size={14} />} label="QR code" onClick={() => setMethod("qr")} />
            </div>

            <div className="mt-5 grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-5">
              <section className="rounded-xl p-5" style={{ background: "#FAF8F2" }}>
                {method === "code" ? (
                  <>
                    <label style={{ fontSize: 12, color: "#6F6F6F", fontWeight: 500 }}>Code input field</label>
                    <input
                      value={code}
                      onChange={(event) => setCode(event.target.value.toUpperCase())}
                      placeholder="TC-204"
                      className="mt-2 h-12 w-full rounded-md bg-white px-4 outline-none"
                      style={{ border: "1px solid #F0EFE9", color: "#1C1C1C", fontSize: 18, fontWeight: 700, letterSpacing: "0.08em" }}
                    />
                    <p className="mt-3" style={{ fontSize: 13, color: "#6F6F6F", lineHeight: 1.55 }}>
                      Ask the facilitator for the code displayed in the room.
                    </p>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: 12, color: "#6F6F6F", fontWeight: 500 }}>QR preview area</div>
                    <div className="mt-2 h-[190px] rounded-xl flex items-center justify-center" style={{ background: "#FFFFFF", border: "1px solid #F0EFE9" }}>
                      <div className="grid grid-cols-5 gap-1">
                        {Array.from({ length: 25 }).map((_, index) => (
                          <span
                            key={index}
                            className="h-5 w-5 rounded-[3px]"
                            style={{ background: [0, 1, 4, 5, 7, 10, 12, 16, 18, 19, 20, 23, 24].includes(index) ? "#1C1C1C" : "#F5A623" }}
                          />
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </section>

              <aside className="rounded-xl p-5 flex flex-col" style={{ background: "#1C1C1C" }}>
                <ScanLine size={28} color="#F5A623" />
                <div className="mt-4" style={{ fontSize: 15, fontWeight: 700, color: "#FFFFFF" }}>Attendance status</div>
                <div className="mt-3 flex-1">
                  <InlineNotice tone={statusTone} title="Current state">
                    {status}
                  </InlineNotice>
                </div>
                <button onClick={submitAttendance} className="motion-button mt-5 rounded-full px-4 py-2" style={{ background: "#F5A623", color: "#FFFFFF", fontSize: 13, fontWeight: 500 }}>
                  Submit attendance
                </button>
              </aside>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button className="motion-button rounded-full px-5 py-2.5" style={{ background: "#F8F8F8", color: "#1C1C1C", fontSize: 13, fontWeight: 500 }}>
                Scan QR
              </button>
              <button onClick={submitAttendance} className="motion-button rounded-full px-5 py-2.5" style={{ background: "#F5A623", color: "#FFFFFF", fontSize: 13, fontWeight: 500 }}>
                Confirm attendance
              </button>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

function Detail({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2" style={{ fontSize: 13, color: "#1C1C1C" }}>
      <span style={{ color: "#F5A623" }}>{icon}</span>
      <span>{label}</span>
    </div>
  );
}

function TabButton({ active, icon, label, onClick }: { active: boolean; icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-full px-3 py-1"
      style={{ background: active ? "#1C1C1C" : "#F8F8F8", color: active ? "#FFFFFF" : "#1C1C1C", fontSize: 12, fontWeight: 500 }}
    >
      {icon}
      {label}
    </button>
  );
}
