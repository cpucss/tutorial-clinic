const ATTENDANCE_QR_PROTOCOL = "tutorial-clinic:";

export function buildAttendanceQrPayload(eventId: string, attendanceCode: string) {
  return `tutorial-clinic://attendance?event=${encodeURIComponent(eventId)}&code=${encodeURIComponent(attendanceCode)}`;
}

export function parseAttendanceQrPayload(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== ATTENDANCE_QR_PROTOCOL || url.hostname !== "attendance") return null;
    const eventId = url.searchParams.get("event")?.trim();
    const code = url.searchParams.get("code")?.trim();
    return eventId && code ? { eventId, code } : null;
  } catch {
    return null;
  }
}
