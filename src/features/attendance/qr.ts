// Opaque single-use QR token validation utilities.
// The QR contains only the raw cryptographic token issued by the server RPC (issue_attendance_qr).
// No student ID, user UUID, name, role, or timestamps are embedded into the QR.

export function isValidOpaqueQrToken(token: string): boolean {
  if (!token || typeof token !== "string") return false;
  const trimmed = token.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.includes("://") || trimmed.includes("?")) {
    return false;
  }
  // Server issues a 32-byte (64 hex characters) opaque random token
  return /^[a-fA-F0-9]{32,128}$/.test(trimmed);
}
