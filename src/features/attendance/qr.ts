const ATTENDANCE_QR_PROTOCOL = "tutorial-clinic:";

export type StudentAttendanceQrPayload = {
  userId: string;
  studentId: string;
  nonce: string;
  issuedAt: number;
  expiresAt: number;
};

export function buildStudentAttendanceQrPayload(payload: StudentAttendanceQrPayload) {
  const params = new URLSearchParams({
    user: payload.userId,
    student: payload.studentId,
    nonce: payload.nonce,
    issued: String(payload.issuedAt),
    expires: String(payload.expiresAt),
  });
  return `tutorial-clinic://student-attendance?${params.toString()}`;
}

export function parseStudentAttendanceQrPayload(value: string): StudentAttendanceQrPayload | null {
  try {
    const url = new URL(value);
    if (url.protocol !== ATTENDANCE_QR_PROTOCOL || url.hostname !== "student-attendance") return null;
    const userId = url.searchParams.get("user")?.trim();
    const studentId = url.searchParams.get("student")?.trim().toUpperCase();
    const nonce = url.searchParams.get("nonce")?.trim();
    const issuedAt = Number(url.searchParams.get("issued"));
    const expiresAt = Number(url.searchParams.get("expires"));
    if (!userId || !studentId || !nonce || !Number.isFinite(issuedAt) || !Number.isFinite(expiresAt) || expiresAt <= issuedAt) return null;
    return { userId, studentId, nonce, issuedAt, expiresAt };
  } catch {
    return null;
  }
}
