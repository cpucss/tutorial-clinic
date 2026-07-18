import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from "react";

import { createSeedState, defaultPreferences, DEMO_STATE_VERSION, DEMO_STORAGE_KEY } from "../data/seed";
import type {
  AttendanceRecord,
  DemoEvent,
  DemoNote,
  DemoNotification,
  DemoState,
  DemoUser,
  NotificationType,
  PointTransaction,
  Preferences,
  SessionStatus,
  Subject,
} from "../types/app";

type Result = { ok: true; message?: string } | { ok: false; message: string };

export type AppDataAction =
  | { type: "LOGIN"; userId: string }
  | { type: "LOGOUT" }
  | { type: "COMPLETE_SETUP"; userId: string; backupEmail: string; password: string }
  | { type: "UPSERT_EVENT"; event: DemoEvent }
  | { type: "DELETE_EVENT"; eventId: string }
  | { type: "TOGGLE_RSVP"; userId: string; eventId: string }
  | { type: "TOGGLE_SCHEDULE"; userId: string; eventId: string }
  | { type: "ADD_ATTENDANCE"; record: AttendanceRecord }
  | { type: "MODERATE_ATTENDANCE"; recordId: string; status: "Approved" | "Rejected"; reviewerId: string; correctionNote?: string }
  | { type: "UPSERT_NOTE"; note: DemoNote }
  | { type: "MODERATE_NOTE"; noteId: string; status: "Approved" | "Rejected"; reviewerId: string; reason?: string }
  | { type: "TOGGLE_FAVOURITE"; userId: string; noteId: string }
  | { type: "MARK_NOTIFICATION"; id: string; read: boolean }
  | { type: "MARK_ALL_NOTIFICATIONS"; userId: string }
  | { type: "DELETE_NOTIFICATION"; id: string }
  | { type: "CLEAR_NOTIFICATIONS"; userId: string }
  | { type: "ADD_NOTIFICATION"; notification: DemoNotification }
  | { type: "UPSERT_SUBJECT"; subject: Subject }
  | { type: "DELETE_SUBJECT"; subjectId: string }
  | { type: "UPDATE_USER"; user: DemoUser }
  | { type: "ADJUST_POINTS"; transaction: PointTransaction; adminId: string }
  | { type: "MARK_ANNOUNCEMENT"; announcementId: string; userId: string }
  | { type: "UPDATE_PREFERENCES"; userId: string; preferences: Preferences };

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function notification(
  userId: string,
  title: string,
  message: string,
  type: NotificationType,
  relatedTab?: string,
): DemoNotification {
  return { id: uid("notif"), userId, title, message, type, relatedTab, createdAt: new Date().toISOString() };
}

export function appDataReducer(state: DemoState, action: AppDataAction): DemoState {
  switch (action.type) {
    case "LOGIN":
      return { ...state, currentUserId: action.userId };
    case "LOGOUT":
      return { ...state, currentUserId: null };
    case "COMPLETE_SETUP":
      return {
        ...state,
        users: state.users.map((user) => user.id === action.userId ? {
          ...user,
          accountSetup: {
            completed: true,
            backupEmail: action.backupEmail,
            demoPassword: action.password,
            completedAt: new Date().toISOString(),
          },
        } : user),
        notifications: [
          notification(action.userId, "Account setup complete", "Your account setup was saved on this device.", "Account", "settings"),
          ...state.notifications,
        ],
      };
    case "UPSERT_EVENT": {
      const exists = state.events.some((event) => event.id === action.event.id);
      return {
        ...state,
        events: exists ? state.events.map((event) => event.id === action.event.id ? action.event : event) : [action.event, ...state.events],
      };
    }
    case "DELETE_EVENT":
      return {
        ...state,
        events: state.events.filter((event) => event.id !== action.eventId),
        rsvps: state.rsvps.filter((rsvp) => rsvp.eventId !== action.eventId),
        attendance: state.attendance.filter((record) => record.eventId !== action.eventId),
        scheduleEventIds: Object.fromEntries(Object.entries(state.scheduleEventIds).map(([userId, ids]) => [userId, ids.filter((id) => id !== action.eventId)])),
      };
    case "TOGGLE_RSVP": {
      const existing = state.rsvps.find((item) => item.userId === action.userId && item.eventId === action.eventId);
      return {
        ...state,
        rsvps: existing
          ? state.rsvps.filter((item) => item.id !== existing.id)
          : [...state.rsvps, { id: uid("rsvp"), userId: action.userId, eventId: action.eventId, createdAt: new Date().toISOString() }],
        scheduleEventIds: existing ? state.scheduleEventIds : {
          ...state.scheduleEventIds,
          [action.userId]: Array.from(new Set([...(state.scheduleEventIds[action.userId] ?? []), action.eventId])),
        },
      };
    }
    case "TOGGLE_SCHEDULE": {
      const ids = state.scheduleEventIds[action.userId] ?? [];
      const exists = ids.includes(action.eventId);
      return { ...state, scheduleEventIds: { ...state.scheduleEventIds, [action.userId]: exists ? ids.filter((id) => id !== action.eventId) : [...ids, action.eventId] } };
    }
    case "ADD_ATTENDANCE":
      return {
        ...state,
        attendance: [action.record, ...state.attendance],
        notifications: [notification(action.record.userId, "Attendance submitted", "Your check-in is waiting for admin review.", "Attendance", "attendance-history"), ...state.notifications],
      };
    case "MODERATE_ATTENDANCE": {
      const record = state.attendance.find((item) => item.id === action.recordId);
      if (!record) return state;
      const wasApproved = record.status === "Approved";
      const event = state.events.find((item) => item.id === record.eventId);
      const pointChange = action.status === "Approved" && !wasApproved ? 40 : action.status === "Rejected" && wasApproved ? -40 : 0;
      const transaction: PointTransaction | null = pointChange ? {
        id: uid("pt"), userId: record.userId, points: pointChange,
        reason: pointChange > 0 ? `Attendance approved: ${event?.title ?? "Tutorial Clinic session"}` : `Attendance correction: ${event?.title ?? "Tutorial Clinic session"}`,
        createdAt: new Date().toISOString(), relatedType: "Attendance", relatedId: record.id,
      } : null;
      return {
        ...state,
        attendance: state.attendance.map((item) => item.id === action.recordId ? {
          ...item, status: action.status, reviewedAt: new Date().toISOString(), reviewedBy: action.reviewerId,
          correctionNote: action.correctionNote,
        } : item),
        points: transaction ? [transaction, ...state.points] : state.points,
        notifications: [notification(
          record.userId,
          action.status === "Approved" ? "Attendance approved" : "Attendance needs attention",
          action.status === "Approved" ? `${event?.title ?? "Your session"} was approved. You earned 40 points.` : (action.correctionNote || "Your check-in was rejected by an administrator."),
          "Attendance",
          "attendance-history",
        ), ...state.notifications],
      };
    }
    case "UPSERT_NOTE": {
      const exists = state.notes.some((note) => note.id === action.note.id);
      return { ...state, notes: exists ? state.notes.map((note) => note.id === action.note.id ? action.note : note) : [action.note, ...state.notes] };
    }
    case "MODERATE_NOTE": {
      const note = state.notes.find((item) => item.id === action.noteId);
      if (!note) return state;
      const award = action.status === "Approved" && note.status !== "Approved";
      const transaction: PointTransaction | null = award ? {
        id: uid("pt"), userId: note.uploaderId, points: 60,
        reason: `Approved note: ${note.title}`, createdAt: new Date().toISOString(), relatedType: "Note", relatedId: note.id,
      } : null;
      return {
        ...state,
        notes: state.notes.map((item) => item.id === note.id ? {
          ...item, status: action.status, rejectionReason: action.status === "Rejected" ? action.reason : undefined,
          moderatedAt: new Date().toISOString(), moderatedBy: action.reviewerId, updatedAt: new Date().toISOString(),
        } : item),
        points: transaction ? [transaction, ...state.points] : state.points,
        notifications: [notification(
          note.uploaderId,
          action.status === "Approved" ? "Note approved" : "Note changes requested",
          action.status === "Approved" ? `${note.title} is now in the Notes Library. You earned 60 points.` : (action.reason || "Please update the note before resubmitting."),
          "Notes",
          "my-notes",
        ), ...state.notifications],
      };
    }
    case "TOGGLE_FAVOURITE": {
      const ids = state.favouriteNoteIds[action.userId] ?? [];
      return { ...state, favouriteNoteIds: { ...state.favouriteNoteIds, [action.userId]: ids.includes(action.noteId) ? ids.filter((id) => id !== action.noteId) : [...ids, action.noteId] } };
    }
    case "MARK_NOTIFICATION":
      return { ...state, notifications: state.notifications.map((item) => item.id === action.id ? { ...item, readAt: action.read ? (item.readAt ?? new Date().toISOString()) : undefined } : item) };
    case "MARK_ALL_NOTIFICATIONS":
      return { ...state, notifications: state.notifications.map((item) => item.userId === action.userId ? { ...item, readAt: item.readAt ?? new Date().toISOString() } : item) };
    case "DELETE_NOTIFICATION":
      return { ...state, notifications: state.notifications.filter((item) => item.id !== action.id) };
    case "CLEAR_NOTIFICATIONS":
      return { ...state, notifications: state.notifications.filter((item) => item.userId !== action.userId) };
    case "ADD_NOTIFICATION":
      return { ...state, notifications: [action.notification, ...state.notifications] };
    case "UPSERT_SUBJECT": {
      const exists = state.subjects.some((subject) => subject.id === action.subject.id);
      return { ...state, subjects: exists ? state.subjects.map((subject) => subject.id === action.subject.id ? action.subject : subject) : [action.subject, ...state.subjects] };
    }
    case "DELETE_SUBJECT":
      return { ...state, subjects: state.subjects.filter((subject) => subject.id !== action.subjectId) };
    case "UPDATE_USER":
      return { ...state, users: state.users.some((user) => user.id === action.user.id) ? state.users.map((user) => user.id === action.user.id ? action.user : user) : [...state.users, action.user], preferences: state.preferences[action.user.id] ? state.preferences : { ...state.preferences, [action.user.id]: { ...defaultPreferences } } };
    case "ADJUST_POINTS":
      return {
        ...state,
        points: [action.transaction, ...state.points],
        notifications: [notification(action.transaction.userId, "Points adjusted", `${action.transaction.points > 0 ? "+" : ""}${action.transaction.points} points: ${action.transaction.reason}`, "Points", "points-history"), ...state.notifications],
      };
    case "MARK_ANNOUNCEMENT":
      return { ...state, announcements: state.announcements.map((item) => item.id === action.announcementId ? { ...item, readBy: Array.from(new Set([...item.readBy, action.userId])) } : item) };
    case "UPDATE_PREFERENCES":
      return { ...state, preferences: { ...state.preferences, [action.userId]: action.preferences } };
    default:
      return state;
  }
}

function loadState(): DemoState {
  try {
    const stored = window.localStorage.getItem(DEMO_STORAGE_KEY);
    if (!stored) return createSeedState();
    const parsed = JSON.parse(stored) as DemoState;
    return parsed.version === DEMO_STATE_VERSION ? parsed : createSeedState();
  } catch {
    return createSeedState();
  }
}

type AppDataContextValue = {
  state: DemoState;
  currentUser: DemoUser | null;
  currentPoints: number;
  unreadCount: number;
  login: (studentId: string) => Result;
  logout: () => void;
  completeAccountSetup: (backupEmail: string, password: string) => Result;
  saveEvent: (input: Partial<DemoEvent> & Pick<DemoEvent, "title" | "subjectId" | "date" | "endDate" | "venue" | "capacity" | "instructor">) => Result;
  deleteEvent: (eventId: string) => void;
  toggleRsvp: (eventId: string) => Result;
  toggleSchedule: (eventId: string) => Result;
  submitAttendance: (eventId: string, code: string, method?: "Code" | "QR") => Result;
  moderateAttendance: (recordId: string, status: "Approved" | "Rejected", note?: string) => Result;
  saveNote: (input: Partial<DemoNote> & Pick<DemoNote, "title" | "subjectId" | "description">, submit?: boolean) => Result & { noteId?: string };
  moderateNote: (noteId: string, status: "Approved" | "Rejected", reason?: string) => Result;
  toggleFavourite: (noteId: string) => Result;
  markNotification: (id: string, read?: boolean) => void;
  markAllNotifications: () => void;
  deleteNotification: (id: string) => void;
  clearNotifications: () => void;
  saveSubject: (input: Partial<Subject> & Pick<Subject, "code" | "name" | "yearLevel">) => Result;
  deleteSubject: (id: string) => Result;
  saveUser: (user: DemoUser) => void;
  adjustPoints: (userId: string, points: number, reason: string) => Result;
  markAnnouncementRead: (id: string) => void;
  updatePreferences: (preferences: Preferences) => void;
};

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appDataReducer, undefined, loadState);
  const currentUser = state.users.find((user) => user.id === state.currentUserId) ?? null;
  const currentPoints = currentUser ? state.points.filter((item) => item.userId === currentUser.id).reduce((sum, item) => sum + item.points, 0) : 0;
  const unreadCount = currentUser ? state.notifications.filter((item) => item.userId === currentUser.id && !item.readAt).length : 0;

  useEffect(() => {
    window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    const preferences = currentUser ? state.preferences[currentUser.id] ?? defaultPreferences : defaultPreferences;
    document.documentElement.dataset.reduceMotion = String(preferences.reducedMotion);
    document.documentElement.dataset.highContrast = String(preferences.highContrast);
    document.documentElement.dataset.compactNavigation = String(preferences.compactNavigation);
  }, [currentUser, state.preferences]);

  const login = useCallback((studentId: string): Result => {
    const normalized = studentId.trim().toUpperCase();
    if (!normalized) return { ok: false, message: "Student ID is required." };
    if (!/^(?:\d{4}-\d{5}|ADMIN-\d{3})$/.test(normalized)) return { ok: false, message: "Invalid Student ID format. Use YYYY-00000." };
    const user = state.users.find((item) => item.studentId.toUpperCase() === normalized && item.active);
    if (!user) return { ok: false, message: "Student account was not found." };
    dispatch({ type: "LOGIN", userId: user.id });
    return { ok: true };
  }, [state.users]);

  const completeAccountSetup = useCallback((backupEmail: string, password: string): Result => {
    if (!currentUser) return { ok: false, message: "No student is signed in." };
    if (!/^\S+@\S+\.\S+$/.test(backupEmail.trim())) return { ok: false, message: "Enter a valid backup email address." };
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password)) return { ok: false, message: "Password does not meet all requirements." };
    dispatch({ type: "COMPLETE_SETUP", userId: currentUser.id, backupEmail: backupEmail.trim(), password });
    return { ok: true };
  }, [currentUser]);

  const saveEvent = useCallback((input: Partial<DemoEvent> & Pick<DemoEvent, "title" | "subjectId" | "date" | "endDate" | "venue" | "capacity" | "instructor">): Result => {
    if (!input.title.trim() || !input.subjectId || !input.venue.trim() || !input.instructor.trim()) return { ok: false, message: "Complete all required session fields." };
    if (!input.date || !input.endDate || Number.isNaN(new Date(input.date).getTime()) || Number.isNaN(new Date(input.endDate).getTime())) return { ok: false, message: "Add a valid start and end date." };
    if (!Number.isFinite(input.capacity) || input.capacity < 1) return { ok: false, message: "Capacity must be at least 1." };
    if (new Date(input.endDate) <= new Date(input.date)) return { ok: false, message: "End time must be after the start time." };
    const event: DemoEvent = {
      id: input.id ?? uid("evt"), title: input.title.trim(), subjectId: input.subjectId,
      description: input.description?.trim() || "Tutorial Clinic study session.", topics: input.topics ?? [],
      date: input.date, endDate: input.endDate, yearLevels: input.yearLevels ?? ["Freshman", "Sophomore", "Junior", "Senior"],
      instructor: input.instructor.trim(), instructorRole: input.instructorRole?.trim() || "Facilitator", venue: input.venue.trim(),
      capacity: Number(input.capacity), status: input.status ?? "Upcoming", attendanceCode: input.attendanceCode?.trim().toUpperCase() || `TC-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
      createdAt: input.createdAt ?? new Date().toISOString(),
    };
    dispatch({ type: "UPSERT_EVENT", event });
    return { ok: true };
  }, []);

  const toggleRsvp = useCallback((eventId: string): Result => {
    if (!currentUser || currentUser.role === "admin") return { ok: false, message: "Sign in as a student to RSVP." };
    const event = state.events.find((item) => item.id === eventId);
    if (!event) return { ok: false, message: "Session was not found." };
    const existing = state.rsvps.some((item) => item.eventId === eventId && item.userId === currentUser.id);
    const count = state.rsvps.filter((item) => item.eventId === eventId).length;
    if (!existing && count >= event.capacity) return { ok: false, message: "This session is already full." };
    if (!existing && ["Cancelled", "Completed"].includes(event.status)) return { ok: false, message: "RSVP is closed for this session." };
    dispatch({ type: "TOGGLE_RSVP", userId: currentUser.id, eventId });
    return { ok: true, message: existing ? "RSVP cancelled." : "RSVP saved and added to My Schedule." };
  }, [currentUser, state.events, state.rsvps]);

  const toggleSchedule = useCallback((eventId: string): Result => {
    if (!currentUser || currentUser.role === "admin") return { ok: false, message: "Sign in as a student to manage a schedule." };
    dispatch({ type: "TOGGLE_SCHEDULE", userId: currentUser.id, eventId });
    return { ok: true };
  }, [currentUser]);

  const submitAttendance = useCallback((eventId: string, code: string, method: "Code" | "QR" = "Code"): Result => {
    if (!currentUser || currentUser.role === "admin") return { ok: false, message: "Sign in as a student to check in." };
    const event = state.events.find((item) => item.id === eventId);
    if (!event) return { ok: false, message: "Session was not found." };
    if (state.attendance.some((item) => item.eventId === eventId && item.userId === currentUser.id && item.status !== "Rejected")) return { ok: false, message: "You have already checked in to this session." };
    if (code.trim().toUpperCase() !== event.attendanceCode.toUpperCase()) return { ok: false, message: "Invalid attendance code for the selected session." };
    const minutes = (Date.now() - new Date(event.date).getTime()) / 60000;
    const arrival = minutes < -10 ? "Early" : minutes <= 10 ? "On time" : "Late";
    dispatch({ type: "ADD_ATTENDANCE", record: { id: uid("att"), eventId, userId: currentUser.id, checkedInAt: new Date().toISOString(), method, arrival, status: "Pending" } });
    return { ok: true, message: "Attendance submitted for admin approval." };
  }, [currentUser, state.attendance, state.events]);

  const moderateAttendance = useCallback((recordId: string, status: "Approved" | "Rejected", note?: string): Result => {
    if (!currentUser || currentUser.role !== "admin") return { ok: false, message: "Admin access is required." };
    if (status === "Rejected" && !note?.trim()) return { ok: false, message: "Add a reason or correction note." };
    dispatch({ type: "MODERATE_ATTENDANCE", recordId, status, reviewerId: currentUser.id, correctionNote: note?.trim() });
    return { ok: true };
  }, [currentUser]);

  const saveNote = useCallback((input: Partial<DemoNote> & Pick<DemoNote, "title" | "subjectId" | "description">, submit = true): Result & { noteId?: string } => {
    if (!currentUser || currentUser.role === "admin") return { ok: false, message: "Sign in as a student to save notes." };
    if (!input.title.trim() || !input.subjectId) return { ok: false, message: "Add a title and subject." };
    if (submit && !input.fileName) return { ok: false, message: "Select a local file before submitting." };
    const existing = input.id ? state.notes.find((item) => item.id === input.id) : undefined;
    const note: DemoNote = {
      id: input.id ?? uid("note"), title: input.title.trim(), subjectId: input.subjectId, description: input.description.trim(), tags: input.tags ?? [],
      uploaderId: currentUser.id, createdAt: existing?.createdAt ?? new Date().toISOString(), updatedAt: new Date().toISOString(), status: submit ? "Pending" : "Draft",
      fileName: input.fileName, fileType: input.fileType, fileId: input.fileId, downloads: existing?.downloads ?? 0,
    };
    dispatch({ type: "UPSERT_NOTE", note });
    if (submit) {
      const admin = state.users.find((user) => user.role === "admin");
      if (admin) dispatch({ type: "ADD_NOTIFICATION", notification: notification(admin.id, "Note ready for review", `${currentUser.name} submitted ${note.title}.`, "Notes", "admin-notes") });
    }
    return { ok: true, noteId: note.id };
  }, [currentUser, state.notes, state.users]);

  const moderateNote = useCallback((noteId: string, status: "Approved" | "Rejected", reason?: string): Result => {
    if (!currentUser || currentUser.role !== "admin") return { ok: false, message: "Admin access is required." };
    if (status === "Rejected" && !reason?.trim()) return { ok: false, message: "A rejection reason is required." };
    dispatch({ type: "MODERATE_NOTE", noteId, status, reviewerId: currentUser.id, reason: reason?.trim() });
    return { ok: true };
  }, [currentUser]);

  const toggleFavourite = useCallback((noteId: string): Result => {
    if (!currentUser || currentUser.role === "admin") return { ok: false, message: "Sign in as a student to save favourites." };
    const note = state.notes.find((item) => item.id === noteId);
    if (!note || note.status !== "Approved") return { ok: false, message: "Only approved notes can be added to favourites." };
    dispatch({ type: "TOGGLE_FAVOURITE", userId: currentUser.id, noteId });
    return { ok: true };
  }, [currentUser, state.notes]);

  const saveSubject = useCallback((input: Partial<Subject> & Pick<Subject, "code" | "name" | "yearLevel">): Result => {
    if (!input.code.trim() || !input.name.trim()) return { ok: false, message: "Subject code and name are required." };
    dispatch({ type: "UPSERT_SUBJECT", subject: { id: input.id ?? uid("sub"), code: input.code.trim().toUpperCase(), name: input.name.trim(), yearLevel: input.yearLevel, coordinator: input.coordinator?.trim() || "TBD", active: input.active ?? true } });
    return { ok: true };
  }, []);

  const deleteSubject = useCallback((id: string): Result => {
    if (state.events.some((event) => event.subjectId === id) || state.notes.some((note) => note.subjectId === id)) return { ok: false, message: "This subject is in use by a session or note and cannot be deleted." };
    dispatch({ type: "DELETE_SUBJECT", subjectId: id });
    return { ok: true };
  }, [state.events, state.notes]);

  const adjustPoints = useCallback((userId: string, points: number, reason: string): Result => {
    if (!currentUser || currentUser.role !== "admin") return { ok: false, message: "Admin access is required." };
    if (!Number.isFinite(points) || points === 0 || !reason.trim()) return { ok: false, message: "Enter a non-zero point value and reason." };
    dispatch({ type: "ADJUST_POINTS", adminId: currentUser.id, transaction: { id: uid("pt"), userId, points, reason: reason.trim(), createdAt: new Date().toISOString(), relatedType: "Adjustment" } });
    return { ok: true };
  }, [currentUser]);

  const value = useMemo<AppDataContextValue>(() => ({
    state, currentUser, currentPoints, unreadCount, login, logout: () => dispatch({ type: "LOGOUT" }), completeAccountSetup,
    saveEvent, deleteEvent: (eventId) => dispatch({ type: "DELETE_EVENT", eventId }), toggleRsvp, toggleSchedule, submitAttendance, moderateAttendance,
    saveNote, moderateNote, toggleFavourite, markNotification: (id, read = true) => dispatch({ type: "MARK_NOTIFICATION", id, read }),
    markAllNotifications: () => currentUser && dispatch({ type: "MARK_ALL_NOTIFICATIONS", userId: currentUser.id }), deleteNotification: (id) => dispatch({ type: "DELETE_NOTIFICATION", id }),
    clearNotifications: () => currentUser && dispatch({ type: "CLEAR_NOTIFICATIONS", userId: currentUser.id }), saveSubject, deleteSubject,
    saveUser: (user) => dispatch({ type: "UPDATE_USER", user }), adjustPoints, markAnnouncementRead: (announcementId) => currentUser && dispatch({ type: "MARK_ANNOUNCEMENT", announcementId, userId: currentUser.id }),
    updatePreferences: (preferences) => currentUser && dispatch({ type: "UPDATE_PREFERENCES", userId: currentUser.id, preferences }),
  }), [adjustPoints, completeAccountSetup, currentPoints, currentUser, deleteSubject, login, moderateAttendance, moderateNote, saveEvent, saveNote, saveSubject, state, submitAttendance, toggleFavourite, toggleRsvp, toggleSchedule, unreadCount]);

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) throw new Error("useAppData must be used inside AppDataProvider");
  return context;
}

export function getUserPoints(state: DemoState, userId: string) {
  return state.points.filter((item) => item.userId === userId).reduce((sum, item) => sum + item.points, 0);
}

export function getRsvpCount(state: DemoState, eventId: string) {
  return state.rsvps.filter((item) => item.eventId === eventId).length;
}

export function effectiveEventStatus(event: DemoEvent): SessionStatus {
  if (["Cancelled", "Draft"].includes(event.status)) return event.status;
  const now = Date.now();
  if (now > new Date(event.endDate).getTime()) return "Completed";
  if (now >= new Date(event.date).getTime()) return "Live";
  return "Upcoming";
}
