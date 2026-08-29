---
title: Repository Contracts
status: recommended
tags: [typescript, repositories, api]
---

# Repository contracts

These contracts are the intended frontend boundary. Names are illustrative; keep one naming convention across the project.

## Auth

```ts
type AuthenticatedAccount = {
  user: User;
  session: Session;
};

signIn(studentId: string, password: string): Promise<AuthenticatedAccount>;
restoreAccount(): Promise<AuthenticatedAccount | null>;
signOut(): Promise<void>;
subscribeToAuth(callback: (account: AuthenticatedAccount | null) => void): () => void;
```

The repository rejects a missing/inactive profile and never derives a role from the input ID.

## Sessions

```ts
listPublishedSessions(): Promise<TutorialSession[]>;
listAdminSessions(): Promise<TutorialSession[]>;
createSession(input: CreateSessionInput): Promise<TutorialSession>;
updateSession(id: string, patch: UpdateSessionInput): Promise<TutorialSession>;
deleteSession(id: string): Promise<void>;
setAttendanceCode(id: string, code: string): Promise<void>;
```

## RSVP

```ts
listMyRsvps(): Promise<Rsvp[]>;
setRsvp(sessionId: string, joined: boolean): Promise<{
  joined: boolean;
  rsvp: Rsvp | null;
}>;
```

The function is deterministic and safe to replay.

## Attendance

```ts
listMyAttendance(): Promise<AttendanceRecord[]>;
listAdminAttendance(filters?: AttendanceFilters): Promise<AttendanceRecord[]>;
checkInWithCode(sessionId: string, code: string): Promise<AttendanceRecord>;
issueAttendanceQr(): Promise<{ token: string; expiresAt: string }>;
recordAttendanceFromQr(sessionId: string, token: string): Promise<QrCheckInResult>;
moderateAttendance(id: string, decision: AttendanceDecision): Promise<AttendanceRecord>;
```

## Notes

```ts
listApprovedNotes(filters?: NoteFilters): Promise<Note[]>;
listMyNotes(): Promise<Note[]>;
createDraft(input: CreateNoteInput): Promise<Note>;
updateDraft(id: string, patch: UpdateNoteInput): Promise<Note>;
uploadFile(noteId: string, file: File): Promise<NoteFile>;
submitNote(id: string): Promise<Note>;
moderateNote(id: string, decision: NoteDecision): Promise<Note>;
downloadFile(file: NoteFile): Promise<Blob>;
```

## Points

```ts
listMyPointHistory(): Promise<PointTransaction[]>;
getLeaderboard(yearLevel?: YearLevel): Promise<LeaderboardEntry[]>;
adjustPoints(userId: string, points: number, reason: string): Promise<PointTransaction>;
```

## Repository result rules

- Resolve only with validated, mapped domain data.
- Throw/return a typed application error for expected backend failures.
- Do not swallow errors or only log them.
- Do not mutate global UI state inside repositories.
- Do not return Supabase query builders to components.
- Do not accept caller-provided owner UUIDs for “my” operations when the server can use `auth.uid()`.
