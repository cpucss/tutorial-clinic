import type { YearLevel } from "./common";

export type UserRole = "student" | "contributor" | "admin";

export type DemoAccountSetup = {
  completed: boolean;
  backupEmail?: string;
  demoPassword?: string;
  completedAt?: string;
};
export type DemoUser = {
  id: string;
  name: string;
  studentId: string;
  yearLevel: YearLevel;
  email: string;
  program: string;
  section: string;
  role: UserRole;
  active: boolean;
  accountSetup: DemoAccountSetup;
};

export type Subject = {
  id: string;
  code: string;
  name: string;
  yearLevel: YearLevel;
  coordinator: string;
  active: boolean;
};

export type SessionStatus = "Draft" | "Upcoming" | "Live" | "Completed" | "Cancelled";

export type DemoEvent = {
  id: string;
  title: string;
  subjectId: string;
  description: string;
  topics: string[];
  date: string;
  endDate: string;
  yearLevels: YearLevel[];
  instructor: string;
  instructorRole: string;
  venue: string;
  capacity: number;
  status: SessionStatus;
  attendanceCode: string;
  createdAt: string;
};

export type Rsvp = {
  id: string;
  eventId: string;
  userId: string;
  createdAt: string;
};

export type AttendanceStatus = "Pending" | "Approved" | "Rejected";
export type ArrivalStatus = "Early" | "On time" | "Late";

export type AttendanceRecord = {
  id: string;
  eventId: string;
  userId: string;
  checkedInAt: string;
  method: "Code" | "QR" | "Manual";
  arrival: ArrivalStatus;
  status: AttendanceStatus;
  correctionNote?: string;
  reviewedAt?: string;
  reviewedBy?: string;
};

export type DemoNoteStatus = "Draft" | "Pending" | "Approved" | "Rejected";

export type DemoNote = {
  id: string;
  title: string;
  subjectId: string;
  description: string;
  tags: string[];
  uploaderId: string;
  createdAt: string;
  updatedAt: string;
  status: DemoNoteStatus;
  fileName?: string;
  fileType?: string;
  fileId?: string;
  downloads: number;
  rejectionReason?: string;
  moderatedAt?: string;
  moderatedBy?: string;
};

export type PointTransaction = {
  id: string;
  userId: string;
  points: number;
  reason: string;
  createdAt: string;
  relatedType: "Attendance" | "Note" | "Adjustment" | "Account";
  relatedId?: string;
};

export type NotificationType = "Event" | "Attendance" | "Notes" | "Points" | "Announcement" | "Account" | "System";

export type DemoNotification = {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  createdAt: string;
  readAt?: string;
  relatedTab?: string;
};

export type Announcement = {
  id: string;
  title: string;
  body: string;
  publishedAt: string;
  pinned: boolean;
  audience: "All" | YearLevel;
  readBy: string[];
};

export type Preferences = {
  reducedMotion: boolean;
  highContrast: boolean;
  compactNavigation: boolean;
  sessionReminders: boolean;
  noteUpdates: boolean;
  leaderboardUpdates: boolean;
};

export type DemoState = {
  version: number;
  currentUserId: string | null;
  users: DemoUser[];
  subjects: Subject[];
  events: DemoEvent[];
  rsvps: Rsvp[];
  attendance: AttendanceRecord[];
  notes: DemoNote[];
  favouriteNoteIds: Record<string, string[]>;
  scheduleEventIds: Record<string, string[]>;
  points: PointTransaction[];
  notifications: DemoNotification[];
  announcements: Announcement[];
  preferences: Record<string, Preferences>;
};
