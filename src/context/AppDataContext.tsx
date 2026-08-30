import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState } from "react";
import { queueMutation } from "../offline/outboxRepository";
import { setupAutoSync } from "../sync/syncEngine";
import {
  getSessions,
  saveSession,
  deleteSession as deleteSessionFromSupabase,
  getUserRsvps,
  setRsvp as setRsvpInSupabase,
  getSubjects,
} from "../services/supabase/sessionRepository";
import {
  getAttendance,
  checkInWithCode,
  recordAttendanceFromQr,
  moderateAttendance as moderateAttendanceInSupabase,
} from "../services/supabase/attendanceRepository";
import {
  getApprovedNotes,
  getMyNotes,
  getPendingNotes,
  createNoteDraft,
  submitNote as submitNoteToSupabase,
  moderateNote as moderateNoteInSupabase,
  toggleNoteFavorite,
  getFavoriteNoteIds,
} from "../services/supabase/notesRepository";
import {
  getPointHistory,
  adjustPoints as adjustPointsInSupabase,
} from "../services/supabase/pointsRepository";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getAnnouncements,
  markAnnouncementAsRead as markAnnouncementAsReadInSupabase,
} from "../services/supabase/notificationsRepository";
import {
  signInStudent,
  signOut as signOutFromSupabase,
  updatePassword,
  subscribeToAuth,
} from "../services/supabase/authAdapter";
import { getProfiles } from "../services/supabase/profileRepository";

import { createSeedState, DEMO_STATE_VERSION, DEMO_STORAGE_KEY } from "../data/seed";
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
  | { type: "SET_INITIAL_STATE"; state: DemoState }
  | { type: "LOGIN"; userId: string }
  | { type: "LOGOUT" }
  | { type: "COMPLETE_SETUP"; userId: string; skipped: boolean }
  | { type: "UPSERT_EVENT"; event: DemoEvent }
  | { type: "DELETE_EVENT"; eventId: string }
  | { type: "SET_EVENTS"; events: DemoEvent[] }
  | { type: "SET_SUBJECTS"; subjects: Subject[] }
  | { type: "SET_RSVPS"; rsvps: DemoState["rsvps"] }
  | { type: "TOGGLE_RSVP"; userId: string; eventId: string }
  | { type: "TOGGLE_SCHEDULE"; userId: string; eventId: string }
  | { type: "ADD_ATTENDANCE"; record: AttendanceRecord }
  | { type: "SET_ATTENDANCE"; attendance: AttendanceRecord[] }
  | { type: "MODERATE_ATTENDANCE"; recordId: string; status: "Approved" | "Rejected"; reviewerId: string; correctionNote?: string }
  | { type: "UPSERT_NOTE"; note: DemoNote }
  | { type: "SET_NOTES"; notes: DemoNote[] }
  | { type: "MODERATE_NOTE"; noteId: string; status: "Approved" | "Rejected"; reviewerId: string; reason?: string }
  | { type: "TOGGLE_FAVOURITE"; userId: string; noteId: string }
  | { type: "SET_FAVOURITES"; noteIds: string[]; userId: string }
  | { type: "MARK_NOTIFICATION"; id: string; read: boolean }
  | { type: "MARK_ALL_NOTIFICATIONS"; userId: string }
  | { type: "DELETE_NOTIFICATION"; id: string }
  | { type: "CLEAR_NOTIFICATIONS"; userId: string }
  | { type: "ADD_NOTIFICATION"; notification: DemoNotification }
  | { type: "SET_NOTIFICATIONS"; notifications: DemoNotification[] }
  | { type: "UPSERT_SUBJECT"; subject: Subject }
  | { type: "DELETE_SUBJECT"; subjectId: string }
  | { type: "UPDATE_USER"; user: DemoUser }
  | { type: "SET_USERS"; users: DemoUser[] }
  | { type: "ADJUST_POINTS"; transaction: PointTransaction; adminId: string }
  | { type: "SET_POINTS"; points: PointTransaction[] }
  | { type: "SET_ANNOUNCEMENTS"; announcements: DemoState["announcements"] }
  | { type: "MARK_ANNOUNCEMENT"; announcementId: string; userId: string }
  | { type: "UPDATE_PREFERENCES"; userId: string; preferences: Preferences };

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function normalizeState(state: DemoState): DemoState {
  return {
    ...state,
    version: DEMO_STATE_VERSION,
    currentUserId: state.currentUserId ?? null,
    users: state.users ?? [],
    events: state.events ?? [],
    subjects: state.subjects ?? [],
    rsvps: state.rsvps ?? [],
    scheduleEventIds: state.scheduleEventIds ?? {},
    attendance: state.attendance ?? [],
    notes: state.notes ?? [],
    favouriteNoteIds: state.favouriteNoteIds ?? {},
    points: state.points ?? [],
    notifications: state.notifications ?? [],
    announcements: state.announcements ?? [],
    preferences: state.preferences ?? {},
  };
}

export function appDataReducer(state: DemoState, action: AppDataAction): DemoState {
  switch (action.type) {
    case "SET_INITIAL_STATE":
      return normalizeState(action.state);
    case "LOGIN": {
      const user = state.users.find((u) => u.id === action.userId);
      if (!user) return state;
      return {
        ...state,
        currentUserId: action.userId,
      };
    }
    case "LOGOUT":
      return {
        ...state,
        currentUserId: null,
      };
    case "COMPLETE_SETUP":
      return {
        ...state,
        users: state.users.map((u) =>
          u.id === action.userId
            ? {
                ...u,
                accountSetup: {
                  completed: true,
                  completedAt: new Date().toISOString(),
                  skipped: action.skipped,
                },
              }
            : u
        ),
      };
    case "UPSERT_EVENT": {
      const index = state.events.findIndex((e) => e.id === action.event.id);
      const events =
        index >= 0
          ? state.events.map((e, i) => (i === index ? action.event : e))
          : [action.event, ...state.events];
      return { ...state, events };
    }
    case "DELETE_EVENT":
      return {
        ...state,
        events: state.events.filter((e) => e.id !== action.eventId),
        rsvps: state.rsvps.filter((r) => r.eventId !== action.eventId),
        attendance: state.attendance.filter((a) => a.eventId !== action.eventId),
      };
    case "SET_EVENTS":
      return { ...state, events: action.events };
    case "SET_SUBJECTS":
      return { ...state, subjects: action.subjects };
    case "SET_RSVPS":
      return { ...state, rsvps: action.rsvps };
    case "TOGGLE_RSVP": {
      const exists = state.rsvps.some(
        (r) => r.eventId === action.eventId && r.userId === action.userId
      );
      const rsvps = exists
        ? state.rsvps.filter(
            (r) => !(r.eventId === action.eventId && r.userId === action.userId)
          )
        : [
            ...state.rsvps,
            {
              id: uid("rsvp"),
              eventId: action.eventId,
              userId: action.userId,
              createdAt: new Date().toISOString(),
            },
          ];

      const currentSchedule = state.scheduleEventIds[action.userId] || [];
      const scheduleEventIds = {
        ...state.scheduleEventIds,
        [action.userId]: exists
          ? currentSchedule
          : currentSchedule.includes(action.eventId)
          ? currentSchedule
          : [...currentSchedule, action.eventId],
      };

      return { ...state, rsvps, scheduleEventIds };
    }
    case "TOGGLE_SCHEDULE": {
      const current = state.scheduleEventIds[action.userId] || [];
      const exists = current.includes(action.eventId);
      return {
        ...state,
        scheduleEventIds: {
          ...state.scheduleEventIds,
          [action.userId]: exists
            ? current.filter((id) => id !== action.eventId)
            : [...current, action.eventId],
        },
      };
    }
    case "ADD_ATTENDANCE":
      return {
        ...state,
        attendance: [action.record, ...state.attendance.filter((a) => a.id !== action.record.id)],
      };
    case "SET_ATTENDANCE":
      return { ...state, attendance: action.attendance };
    case "MODERATE_ATTENDANCE": {
      const record = state.attendance.find((a) => a.id === action.recordId);
      if (!record) return state;

      const updatedRecord: AttendanceRecord = {
        ...record,
        status: action.status,
        reviewedAt: new Date().toISOString(),
        reviewedBy: action.reviewerId,
        correctionNote: action.correctionNote,
      };

      let nextPoints = state.points;
      let nextNotifications = state.notifications;

      if (action.status === "Approved" && record.status !== "Approved") {
        const pointTx: PointTransaction = {
          id: uid("pt"),
          userId: record.userId,
          points: 40,
          reason: "Attended tutorial session",
          createdAt: new Date().toISOString(),
          relatedType: "Attendance",
          relatedId: record.id,
        };
        nextPoints = [pointTx, ...nextPoints];

        const notif: DemoNotification = {
          id: uid("notif"),
          userId: record.userId,
          title: "Attendance approved",
          message: "Your attendance was approved. +40 points awarded!",
          type: "Attendance",
          createdAt: new Date().toISOString(),
          relatedTab: "attendance",
        };
        nextNotifications = [notif, ...nextNotifications];
      }

      return {
        ...state,
        attendance: state.attendance.map((a) =>
          a.id === action.recordId ? updatedRecord : a
        ),
        points: nextPoints,
        notifications: nextNotifications,
      };
    }
    case "UPSERT_NOTE": {
      const index = state.notes.findIndex((n) => n.id === action.note.id);
      const notes =
        index >= 0
          ? state.notes.map((n, i) => (i === index ? action.note : n))
          : [action.note, ...state.notes];
      return { ...state, notes };
    }
    case "SET_NOTES":
      return { ...state, notes: action.notes };
    case "MODERATE_NOTE": {
      const note = state.notes.find((n) => n.id === action.noteId);
      if (!note) return state;

      const updatedNote: DemoNote = {
        ...note,
        status: action.status,
        moderatedAt: new Date().toISOString(),
        moderatedBy: action.reviewerId,
        rejectionReason: action.status === "Rejected" ? action.reason : undefined,
      };

      let nextPoints = state.points;
      let nextNotifications = state.notifications;

      if (action.status === "Approved" && note.status !== "Approved") {
        const pointTx: PointTransaction = {
          id: uid("pt"),
          userId: note.uploaderId,
          points: 60,
          reason: `Approved study note: ${note.title}`,
          createdAt: new Date().toISOString(),
          relatedType: "Note",
          relatedId: note.id,
        };
        nextPoints = [pointTx, ...nextPoints];

        const notif: DemoNotification = {
          id: uid("notif"),
          userId: note.uploaderId,
          title: "Note approved",
          message: `Your study note "${note.title}" was approved! +60 points awarded.`,
          type: "Notes",
          createdAt: new Date().toISOString(),
          relatedTab: "notes",
        };
        nextNotifications = [notif, ...nextNotifications];
      }

      return {
        ...state,
        notes: state.notes.map((n) => (n.id === action.noteId ? updatedNote : n)),
        points: nextPoints,
        notifications: nextNotifications,
      };
    }
    case "TOGGLE_FAVOURITE": {
      const current = state.favouriteNoteIds[action.userId] || [];
      const exists = current.includes(action.noteId);
      return {
        ...state,
        favouriteNoteIds: {
          ...state.favouriteNoteIds,
          [action.userId]: exists
            ? current.filter((id) => id !== action.noteId)
            : [...current, action.noteId],
        },
      };
    }
    case "SET_FAVOURITES":
      return {
        ...state,
        favouriteNoteIds: {
          ...state.favouriteNoteIds,
          [action.userId]: action.noteIds,
        },
      };
    case "MARK_NOTIFICATION":
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.id === action.id ? { ...n, readAt: action.read ? new Date().toISOString() : undefined } : n
        ),
      };
    case "MARK_ALL_NOTIFICATIONS":
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.userId === action.userId ? { ...n, readAt: new Date().toISOString() } : n
        ),
      };
    case "DELETE_NOTIFICATION":
      return {
        ...state,
        notifications: state.notifications.filter((n) => n.id !== action.id),
      };
    case "CLEAR_NOTIFICATIONS":
      return {
        ...state,
        notifications: state.notifications.filter((n) => n.userId !== action.userId),
      };
    case "ADD_NOTIFICATION":
      return {
        ...state,
        notifications: [action.notification, ...state.notifications],
      };
    case "SET_NOTIFICATIONS":
      return { ...state, notifications: action.notifications };
    case "UPSERT_SUBJECT": {
      const index = state.subjects.findIndex((s) => s.id === action.subject.id);
      const subjects =
        index >= 0
          ? state.subjects.map((s, i) => (i === index ? action.subject : s))
          : [...state.subjects, action.subject];
      return { ...state, subjects };
    }
    case "DELETE_SUBJECT":
      return {
        ...state,
        subjects: state.subjects.filter((s) => s.id !== action.subjectId),
      };
    case "UPDATE_USER":
      return {
        ...state,
        users: state.users.map((u) => (u.id === action.user.id ? action.user : u)),
      };
    case "SET_USERS":
      return { ...state, users: action.users };
    case "ADJUST_POINTS": {
      const notif: DemoNotification = {
        id: uid("notif"),
        userId: action.transaction.userId,
        title: "Points adjusted",
        message: `An administrator adjusted your points: ${action.transaction.points > 0 ? "+" : ""}${action.transaction.points} (${action.transaction.reason}).`,
        type: "Points",
        createdAt: new Date().toISOString(),
        relatedTab: "leaderboard",
      };
      return {
        ...state,
        points: [action.transaction, ...state.points],
        notifications: [notif, ...state.notifications],
      };
    }
    case "SET_POINTS":
      return { ...state, points: action.points };
    case "SET_ANNOUNCEMENTS":
      return { ...state, announcements: action.announcements };
    case "MARK_ANNOUNCEMENT": {
      const exists = state.announcements.some((a) => a.id === action.announcementId);
      if (!exists) return state;
      return {
        ...state,
        announcements: state.announcements.map((a) =>
          a.id === action.announcementId
            ? { ...a, readBy: a.readBy.includes(action.userId) ? a.readBy : [...a.readBy, action.userId] }
            : a
        ),
      };
    }
    case "UPDATE_PREFERENCES":
      return {
        ...state,
        preferences: { ...state.preferences, [action.userId]: action.preferences },
      };
    default:
      return state;
  }
}

export type AppDataContextValue = {
  state: DemoState;
  currentUser: DemoUser | undefined;
  currentPoints: number;
  unreadCount: number;
  authInitializing: boolean;
  login: (studentId: string, name?: string, supabaseRole?: string, authUserId?: string, password?: string) => Result;
  logout: () => void;
  completeAccountSetup: (password: string, skip?: boolean) => Promise<Result>;
  saveEvent: (input: Partial<DemoEvent> & Pick<DemoEvent, "title" | "subjectId" | "date" | "endDate" | "venue" | "capacity">) => Promise<Result>;
  deleteEvent: (eventId: string) => Promise<Result>;
  toggleRsvp: (eventId: string) => Promise<Result>;
  toggleSchedule: (eventId: string) => Result;
  submitAttendance: (eventId: string, code: string, method?: "Code" | "QR") => Promise<Result>;
  recordStudentQrAttendance: (eventId: string, token: string) => Promise<Result & { studentName?: string; studentId?: string }>;
  moderateAttendance: (recordId: string, status: "Approved" | "Rejected", note?: string) => Promise<Result>;
  saveNote: (input: Partial<DemoNote> & Pick<DemoNote, "title" | "subjectId" | "description">, submit?: boolean) => Promise<Result & { noteId?: string }>;
  moderateNote: (noteId: string, status: "Approved" | "Rejected", reason?: string) => Promise<Result>;
  toggleFavourite: (noteId: string) => Promise<Result>;
  markNotification: (id: string, read?: boolean) => Promise<Result>;
  markAllNotifications: () => Promise<Result>;
  deleteNotification: (id: string) => Result;
  clearNotifications: () => Result;
  saveSubject: (input: Partial<Subject> & Pick<Subject, "code" | "name" | "yearLevel">) => Result;
  deleteSubject: (id: string) => Result;
  saveUser: (user: DemoUser) => Result;
  adjustPoints: (userId: string, points: number, reason: string) => Promise<Result>;
  markAnnouncementRead: (announcementId: string) => Promise<Result>;
  updatePreferences: (preferences: Preferences) => Result;
};

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appDataReducer, undefined, () => {
    try {
      const stored = window.localStorage.getItem(DEMO_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.version === DEMO_STATE_VERSION) return parsed;
      }
    } catch {
      // Fallback to seed state
    }
    return createSeedState();
  });

  const [authInitializing, setAuthInitializing] = useState(true);

  // Persist state cache to localStorage
  useEffect(() => {
    try {
      window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage unavailable or quota reached
    }
  }, [state]);

  // Setup offline background sync
  useEffect(() => {
    const cleanup = setupAutoSync();
    return () => cleanup();
  }, []);

  // Listen to Supabase auth state changes
  useEffect(() => {
    const unsubscribe = subscribeToAuth((account) => {
      if (account) {
        const studentId = account.profile.studentId.toUpperCase();
        let matchedUser = state.users.find((u) => u.studentId.toUpperCase() === studentId || u.authUserId === account.user.id);

        if (!matchedUser) {
          matchedUser = {
            id: uid("stu"),
            authUserId: account.user.id,
            studentId,
            name: account.profile.name || "Student",
            email: account.user.email || `${studentId.toLowerCase()}@cpu.edu.ph`,
            role: account.profile.role || "student",
            yearLevel: account.profile.yearLevel || "Freshman",
            program: account.profile.program || "BS Computer Science",
            section: account.profile.section || "A",
            active: account.profile.active,
            accountSetup: {
              completed: Boolean(account.profile.accountSetupCompleted),
            },
          };
          dispatch({ type: "SET_USERS", users: [...state.users, matchedUser] });
        } else if (!matchedUser.authUserId) {
          matchedUser = { ...matchedUser, authUserId: account.user.id };
          dispatch({ type: "UPDATE_USER", user: matchedUser });
        }

        dispatch({ type: "LOGIN", userId: matchedUser.id });
      }
      setAuthInitializing(false);
    });

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [state.users]);

  // Hydrate application state from Supabase
  useEffect(() => {
    let active = true;

    async function hydrate() {
      try {
        const [
          subjRes,
          sessRes,
          appNotesRes,
          pendNotesRes,
          annRes,
          profilesRes,
        ] = await Promise.all([
          getSubjects(),
          getSessions(),
          getApprovedNotes(),
          getPendingNotes(),
          getAnnouncements(),
          getProfiles(),
        ]);

        if (!active) return;

        if (subjRes.data) dispatch({ type: "SET_SUBJECTS", subjects: subjRes.data });
        if (sessRes.data) dispatch({ type: "SET_EVENTS", events: sessRes.data });
        if (appNotesRes.data && pendNotesRes.data) {
          const merged = [...appNotesRes.data, ...pendNotesRes.data];
          const uniqueNotes = Array.from(new Map(merged.map((n) => [n.id, n])).values());
          dispatch({ type: "SET_NOTES", notes: uniqueNotes });
        }
        if (annRes.data) {
          const mappedAnn = annRes.data.map((row: any) => ({
            id: row.id,
            title: row.title,
            body: row.body,
            publishedAt: row.published_at || row.created_at,
            pinned: Boolean(row.pinned),
            audience: row.audience || "All",
            readBy: [],
          }));
          dispatch({ type: "SET_ANNOUNCEMENTS", announcements: mappedAnn });
        }
        if (profilesRes.data && profilesRes.data.length > 0) {
          const users: DemoUser[] = profilesRes.data.map((p) => ({
            id: p.id,
            authUserId: p.id,
            studentId: p.studentId,
            name: p.name,
            email: `${p.studentId.toLowerCase()}@cpu.edu.ph`,
            role: p.role,
            yearLevel: p.yearLevel,
            program: p.program,
            section: p.section,
            active: p.active,
            accountSetup: {
              completed: p.accountSetupCompleted,
            },
          }));
          dispatch({ type: "SET_USERS", users });
        }
      } catch (err) {
        console.warn("Could not reach Supabase backend. Running in offline/demo mode.", err);
      }
    }

    hydrate();
    return () => {
      active = false;
    };
  }, []);

  const currentUser = useMemo(() => {
    if (!state.currentUserId) return undefined;
    return state.users.find((u) => u.id === state.currentUserId);
  }, [state.currentUserId, state.users]);

  // Load user-specific records upon login
  useEffect(() => {
    if (!currentUser) return;
    const userId = currentUser.authUserId || currentUser.id;

    async function loadUserRecords() {
      const [rsvpsRes, attRes, myNotesRes, favsRes, pointsRes, notifsRes] =
        await Promise.all([
          getUserRsvps(userId),
          getAttendance(currentUser?.role === "admin" ? undefined : userId),
          getMyNotes(userId),
          getFavoriteNoteIds(),
          getPointHistory(userId),
          getNotifications(userId),
        ]);

      if (rsvpsRes.data) dispatch({ type: "SET_RSVPS", rsvps: rsvpsRes.data });
      if (attRes.data) dispatch({ type: "SET_ATTENDANCE", attendance: attRes.data });
      if (myNotesRes.data) {
        dispatch({
          type: "SET_NOTES",
          notes: Array.from(new Map([...state.notes, ...myNotesRes.data].map((n) => [n.id, n])).values()),
        });
      }
      if (favsRes.data && currentUser) {
        dispatch({ type: "SET_FAVOURITES", userId: currentUser.id, noteIds: favsRes.data });
      }
      if (pointsRes.data) dispatch({ type: "SET_POINTS", points: pointsRes.data });
      if (notifsRes.data) {
        const notifs: DemoNotification[] = notifsRes.data.map((row: any) => ({
          id: row.id,
          userId: row.user_id,
          title: row.title,
          message: row.message,
          type: (row.type as NotificationType) || "System",
          createdAt: row.created_at,
          readAt: row.read_at || undefined,
          relatedTab: row.related_tab || undefined,
        }));
        dispatch({ type: "SET_NOTIFICATIONS", notifications: notifs });
      }
    }

    loadUserRecords();
  }, [currentUser]);

  const currentPoints = useMemo(() => {
    if (!currentUser) return 0;
    return state.points
      .filter((p) => p.userId === currentUser.id || p.userId === currentUser.authUserId)
      .reduce((sum, p) => sum + p.points, 0);
  }, [currentUser, state.points]);

  const unreadCount = useMemo(() => {
    if (!currentUser) return 0;
    return state.notifications.filter(
      (n) => (n.userId === currentUser.id || n.userId === currentUser.authUserId) && !n.readAt
    ).length;
  }, [currentUser, state.notifications]);

  const login = useCallback(
    (studentId: string, name?: string, supabaseRole?: string, authUserId?: string, password?: string): Result => {
      const normalizedId = studentId.trim().toUpperCase();
      if (!/^\d{4}-\d{5}$/.test(normalizedId)) {
        return { ok: false, message: "Invalid Student ID format. Use YYYY-00000." };
      }

      let user = state.users.find(
        (u) => u.studentId.toUpperCase() === normalizedId || (authUserId && u.authUserId === authUserId)
      );

      if (!user) {
        const isDefaultAdmin = normalizedId === "2021-00001";
        user = {
          id: uid("stu"),
          authUserId,
          studentId: normalizedId,
          name: name || (isDefaultAdmin ? "Admin User" : "New Student"),
          email: `${normalizedId.toLowerCase()}@cpu.edu.ph`,
          role: (supabaseRole as DemoUser["role"]) || (isDefaultAdmin ? "admin" : "student"),
          yearLevel: "Freshman",
          program: "BS Computer Science",
          section: "A",
          active: true,
          accountSetup: {
            completed: !isDefaultAdmin ? false : true,
          },
        };
        dispatch({ type: "SET_USERS", users: [...state.users, user] });
      } else {
        if (authUserId && !user.authUserId) {
          user = { ...user, authUserId };
          dispatch({ type: "UPDATE_USER", user });
        }
      }

      if (!user.active) {
        return { ok: false, message: "This account has been deactivated. Contact an administrator." };
      }

      if (password) {
        signInStudent(normalizedId, password).catch(() => {
          // Keep local session if backend auth is offline
        });
      }

      dispatch({ type: "LOGIN", userId: user.id });
      return { ok: true };
    },
    [state.users]
  );

  const logout = useCallback(() => {
    signOutFromSupabase().catch(() => {});
    dispatch({ type: "LOGOUT" });
  }, []);

  const completeAccountSetup = useCallback(
    async (password: string, skip = false): Promise<Result> => {
      if (!currentUser) return { ok: false, message: "No active session" };

      if (skip) {
        dispatch({ type: "COMPLETE_SETUP", userId: currentUser.id, skipped: true });
        return { ok: true };
      }

      if (!password || password.length < 8) {
        return { ok: false, message: "Password must be at least 8 characters." };
      }

      const res = await updatePassword(password);
      if (res.error) {
        return { ok: false, message: res.error || "Failed to update password." };
      }

      dispatch({ type: "COMPLETE_SETUP", userId: currentUser.id, skipped: false });
      return { ok: true };
    },
    [currentUser]
  );

  const saveEvent = useCallback(
    async (
      input: Partial<DemoEvent> & Pick<DemoEvent, "title" | "subjectId" | "date" | "endDate" | "venue" | "capacity">
    ): Promise<Result> => {
      if (!input.title.trim() || !input.subjectId || !input.venue.trim()) {
        return { ok: false, message: "Complete all required session fields (title, subject, venue)." };
      }
      if (
        !input.date ||
        !input.endDate ||
        Number.isNaN(new Date(input.date).getTime()) ||
        Number.isNaN(new Date(input.endDate).getTime())
      ) {
        return { ok: false, message: "Add a valid start and end date." };
      }
      if (!Number.isFinite(input.capacity) || input.capacity < 1) {
        return { ok: false, message: "Capacity must be at least 1." };
      }
      if (new Date(input.endDate) <= new Date(input.date)) {
        return { ok: false, message: "End time must be after the start time." };
      }

      const event: DemoEvent = {
        id: input.id ?? uid("evt"),
        title: input.title.trim(),
        subjectId: input.subjectId,
        description: input.description?.trim() || "Tutorial Clinic study session.",
        topics: input.topics ?? [],
        date: input.date,
        endDate: input.endDate,
        yearLevels: input.yearLevels ?? ["Freshman", "Sophomore", "Junior", "Senior"],
        instructor: input.instructor?.trim() || "To Be Determined",
        instructorRole: input.instructorRole?.trim() || "Facilitator",
        venue: input.venue.trim(),
        capacity: Number(input.capacity),
        status: input.status ?? "Upcoming",
        attendanceCode: input.attendanceCode?.trim().toUpperCase() || "",
        createdAt: input.createdAt ?? new Date().toISOString(),
      };

      const res = await saveSession(event);
      if (res.error) {
        if (!navigator.onLine || res.error.includes("Failed to fetch")) {
          dispatch({ type: "UPSERT_EVENT", event });
          return { ok: true, message: "Session saved locally (offline)." };
        }
        return { ok: false, message: res.error };
      }

      if (res.data) {
        dispatch({ type: "UPSERT_EVENT", event: res.data });
      } else {
        dispatch({ type: "UPSERT_EVENT", event });
      }
      return { ok: true, message: "Session saved successfully." };
    },
    []
  );

  const deleteEvent = useCallback(async (eventId: string): Promise<Result> => {
    const res = await deleteSessionFromSupabase(eventId);
    if (res.error && navigator.onLine && !res.error.includes("Failed to fetch")) {
      return { ok: false, message: res.error };
    }
    dispatch({ type: "DELETE_EVENT", eventId });
    return { ok: true, message: "Session deleted." };
  }, []);

  const toggleRsvp = useCallback(
    async (eventId: string): Promise<Result> => {
      if (!currentUser || currentUser.role === "admin") {
        return { ok: false, message: "Sign in as a student to RSVP." };
      }
      const event = state.events.find((item) => item.id === eventId);
      if (!event) return { ok: false, message: "Session was not found." };

      const existing = state.rsvps.some(
        (item) => item.eventId === eventId && (item.userId === currentUser.id || item.userId === currentUser.authUserId)
      );
      const count = state.rsvps.filter((item) => item.eventId === eventId).length;

      if (!existing && count >= event.capacity) {
        return { ok: false, message: "This session is already full." };
      }
      if (!existing && ["Cancelled", "Completed"].includes(event.status)) {
        return { ok: false, message: "RSVP is closed for this session." };
      }

      // Optimistic local dispatch
      dispatch({ type: "TOGGLE_RSVP", userId: currentUser.id, eventId });

      try {
        const res = await setRsvpInSupabase(eventId, !existing);
        if (res.error) {
          const errorMsg = res.error;
          if (!navigator.onLine || errorMsg.includes("Failed to fetch")) {
            await queueMutation(currentUser.authUserId || currentUser.id, "rsvp", eventId, "set", {
              sessionId: eventId,
              joined: !existing,
            });
            return {
              ok: true,
              message: existing ? "RSVP cancelled (queued offline)." : "RSVP saved (queued offline).",
            };
          }
          // Rollback on server business rejection
          dispatch({ type: "TOGGLE_RSVP", userId: currentUser.id, eventId });
          return { ok: false, message: res.error };
        }
      } catch {
        await queueMutation(currentUser.authUserId || currentUser.id, "rsvp", eventId, "set", {
          sessionId: eventId,
          joined: !existing,
        });
      }

      return {
        ok: true,
        message: existing ? "RSVP cancelled." : "RSVP saved and added to My Schedule.",
      };
    },
    [currentUser, state.events, state.rsvps]
  );

  const toggleSchedule = useCallback(
    (eventId: string): Result => {
      if (!currentUser || currentUser.role === "admin") {
        return { ok: false, message: "Sign in as a student to manage a schedule." };
      }
      dispatch({ type: "TOGGLE_SCHEDULE", userId: currentUser.id, eventId });
      return { ok: true };
    },
    [currentUser]
  );

  const submitAttendance = useCallback(
    async (eventId: string, code: string, method: "Code" | "QR" = "Code"): Promise<Result> => {
      if (!currentUser || currentUser.role === "admin") {
        return { ok: false, message: "Sign in as a student to check in." };
      }
      const event = state.events.find((item) => item.id === eventId);
      if (!event) return { ok: false, message: "Session was not found." };

      const minutes = (Date.now() - new Date(event.date).getTime()) / 60000;
      const arrival = minutes < -10 ? "Early" : minutes <= 10 ? "On time" : "Late";

      const res = await checkInWithCode(eventId, code);
      if (res.error) {
        if (!navigator.onLine || res.error.includes("Failed to fetch")) {
          const record: AttendanceRecord = {
            id: uid("att"),
            eventId,
            userId: currentUser.id,
            checkedInAt: new Date().toISOString(),
            method,
            arrival,
            status: "Pending",
          };
          dispatch({ type: "ADD_ATTENDANCE", record });
          await queueMutation(currentUser.authUserId || currentUser.id, "attendance", eventId, "upsert", {
            sessionId: eventId,
            code,
          });
          return { ok: true, message: "Attendance queued for offline sync." };
        }
        return { ok: false, message: res.error };
      }

      if (res.data) {
        dispatch({ type: "ADD_ATTENDANCE", record: res.data });
      }
      return { ok: true, message: "Attendance submitted for admin approval." };
    },
    [currentUser, state.events]
  );

  const recordStudentQrAttendance = useCallback(
    async (eventId: string, token: string): Promise<Result & { studentName?: string; studentId?: string }> => {
      if (!currentUser || currentUser.role !== "admin") {
        return { ok: false, message: "Admin access is required." };
      }

      const res = await recordAttendanceFromQr(eventId, token);
      if (res.error || !res.data) {
        return { ok: false, message: res.error || "Failed to record QR attendance." };
      }

      dispatch({ type: "ADD_ATTENDANCE", record: res.data });
      return {
        ok: true,
        studentName: res.studentName,
        studentId: res.studentId,
        message: `${res.studentName || "Student"}'s attendance was recorded and approved (+40 pts).`,
      };
    },
    [currentUser]
  );

  const moderateAttendance = useCallback(
    async (recordId: string, status: "Approved" | "Rejected", note?: string): Promise<Result> => {
      if (!currentUser || currentUser.role !== "admin") {
        return { ok: false, message: "Admin access is required." };
      }
      if (status === "Rejected" && !note?.trim()) {
        return { ok: false, message: "Add a reason or correction note." };
      }

      const res = await moderateAttendanceInSupabase(recordId, status, note);
      if (res.error && navigator.onLine && !res.error.includes("Failed to fetch")) {
        return { ok: false, message: res.error };
      }

      dispatch({
        type: "MODERATE_ATTENDANCE",
        recordId,
        status,
        reviewerId: currentUser.id,
        correctionNote: note?.trim(),
      });
      return { ok: true, message: `Attendance ${status.toLowerCase()}.` };
    },
    [currentUser]
  );

  const saveNote = useCallback(
    async (
      input: Partial<DemoNote> & Pick<DemoNote, "title" | "subjectId" | "description">,
      submit = true
    ): Promise<Result & { noteId?: string }> => {
      if (!currentUser || currentUser.role === "admin") {
        return { ok: false, message: "Sign in as a student to save notes." };
      }
      if (!input.title.trim() || !input.subjectId) {
        return { ok: false, message: "Add a title and subject." };
      }
      if (submit && !input.fileName) {
        return { ok: false, message: "Select a local file before submitting." };
      }

      const existing = input.id ? state.notes.find((item) => item.id === input.id) : undefined;
      const note: DemoNote = {
        id: input.id ?? uid("note"),
        title: input.title.trim(),
        subjectId: input.subjectId,
        description: input.description.trim(),
        tags: input.tags ?? [],
        uploaderId: currentUser.id,
        createdAt: existing?.createdAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: submit ? "Pending" : "Draft",
        fileName: input.fileName,
        fileType: input.fileType,
        fileId: input.fileId,
        downloads: existing?.downloads ?? 0,
      };

      const res = await createNoteDraft({
        title: input.title.trim(),
        subjectId: input.subjectId,
        description: input.description.trim(),
        tags: input.tags || [],
      });

      if (res.data && submit) {
        await submitNoteToSupabase(res.data.id);
      }

      dispatch({ type: "UPSERT_NOTE", note: res.data || note });
      return {
        ok: true,
        noteId: res.data?.id || note.id,
        message: submit ? "Note submitted for moderation." : "Draft saved.",
      };
    },
    [currentUser, state.notes]
  );

  const moderateNote = useCallback(
    async (noteId: string, status: "Approved" | "Rejected", reason?: string): Promise<Result> => {
      if (!currentUser || currentUser.role !== "admin") {
        return { ok: false, message: "Admin access is required." };
      }
      if (status === "Rejected" && !reason?.trim()) {
        return { ok: false, message: "A rejection reason is required." };
      }

      const res = await moderateNoteInSupabase(noteId, status, reason);
      if (res.error && navigator.onLine && !res.error.includes("Failed to fetch")) {
        return { ok: false, message: res.error };
      }

      dispatch({
        type: "MODERATE_NOTE",
        noteId,
        status,
        reviewerId: currentUser.id,
        reason: reason?.trim(),
      });
      return { ok: true, message: `Note ${status.toLowerCase()}.` };
    },
    [currentUser]
  );

  const toggleFavourite = useCallback(
    async (noteId: string): Promise<Result> => {
      if (!currentUser || currentUser.role === "admin") {
        return { ok: false, message: "Sign in as a student to save favourites." };
      }
      const note = state.notes.find((item) => item.id === noteId);
      if (!note || note.status !== "Approved") {
        return { ok: false, message: "Only approved notes can be added to favourites." };
      }

      const userFavs = state.favouriteNoteIds[currentUser.id] || [];
      const isFav = userFavs.includes(noteId);

      dispatch({ type: "TOGGLE_FAVOURITE", userId: currentUser.id, noteId });
      await toggleNoteFavorite(noteId, !isFav);
      return { ok: true };
    },
    [currentUser, state.favouriteNoteIds, state.notes]
  );

  const saveSubject = useCallback(
    (input: Partial<Subject> & Pick<Subject, "code" | "name" | "yearLevel">): Result => {
      if (!input.code.trim() || !input.name.trim()) {
        return { ok: false, message: "Subject code and name are required." };
      }
      dispatch({
        type: "UPSERT_SUBJECT",
        subject: {
          id: input.id ?? uid("sub"),
          code: input.code.trim().toUpperCase(),
          name: input.name.trim(),
          yearLevel: input.yearLevel,
          coordinator: input.coordinator?.trim() || "TBD",
          active: input.active ?? true,
        },
      });
      return { ok: true };
    },
    []
  );

  const deleteSubject = useCallback(
    (id: string): Result => {
      if (
        state.events.some((event) => event.subjectId === id) ||
        state.notes.some((note) => note.subjectId === id)
      ) {
        return { ok: false, message: "This subject is in use and cannot be deleted." };
      }
      dispatch({ type: "DELETE_SUBJECT", subjectId: id });
      return { ok: true };
    },
    [state.events, state.notes]
  );

  const adjustPoints = useCallback(
    async (userId: string, points: number, reason: string): Promise<Result> => {
      if (!currentUser || currentUser.role !== "admin") {
        return { ok: false, message: "Admin access is required." };
      }
      if (!Number.isFinite(points) || points === 0 || !reason.trim()) {
        return { ok: false, message: "Enter a non-zero point value and reason." };
      }

      const res = await adjustPointsInSupabase(userId, points, reason);
      if (res.error && navigator.onLine && !res.error.includes("Failed to fetch")) {
        return { ok: false, message: res.error };
      }

      dispatch({
        type: "ADJUST_POINTS",
        adminId: currentUser.id,
        transaction: res.data || {
          id: uid("pt"),
          userId,
          points,
          reason: reason.trim(),
          createdAt: new Date().toISOString(),
          relatedType: "Adjustment",
        },
      });
      return { ok: true, message: "Points adjusted." };
    },
    [currentUser]
  );

  const markNotification = useCallback(async (id: string, read = true): Promise<Result> => {
    dispatch({ type: "MARK_NOTIFICATION", id, read });
    await markNotificationAsRead(id, read);
    return { ok: true };
  }, []);

  const markAllNotifications = useCallback(async (): Promise<Result> => {
    if (!currentUser) return { ok: false, message: "Not logged in" };
    dispatch({ type: "MARK_ALL_NOTIFICATIONS", userId: currentUser.id });
    await markAllNotificationsAsRead(currentUser.authUserId || currentUser.id);
    return { ok: true };
  }, [currentUser]);

  const markAnnouncementRead = useCallback(
    async (announcementId: string): Promise<Result> => {
      if (!currentUser) return { ok: false, message: "Not logged in" };
      dispatch({ type: "MARK_ANNOUNCEMENT", announcementId, userId: currentUser.id });
      await markAnnouncementAsReadInSupabase(announcementId);
      return { ok: true };
    },
    [currentUser]
  );

  const updatePreferences = useCallback(
    (preferences: Preferences): Result => {
      if (!currentUser) return { ok: false, message: "Not logged in" };
      dispatch({ type: "UPDATE_PREFERENCES", userId: currentUser.id, preferences });
      return { ok: true };
    },
    [currentUser]
  );

  const value = useMemo<AppDataContextValue>(
    () => ({
      state,
      currentUser,
      currentPoints,
      unreadCount,
      authInitializing,
      login,
      logout,
      completeAccountSetup,
      saveEvent,
      deleteEvent,
      toggleRsvp,
      toggleSchedule,
      submitAttendance,
      recordStudentQrAttendance,
      moderateAttendance,
      saveNote,
      moderateNote,
      toggleFavourite,
      markNotification,
      markAllNotifications,
      deleteNotification: (id: string) => {
        dispatch({ type: "DELETE_NOTIFICATION", id });
        return { ok: true };
      },
      clearNotifications: () => {
        if (!currentUser) return { ok: false, message: "Not logged in" };
        dispatch({ type: "CLEAR_NOTIFICATIONS", userId: currentUser.id });
        return { ok: true };
      },
      saveSubject,
      deleteSubject,
      saveUser: (user: DemoUser) => {
        dispatch({ type: "UPDATE_USER", user });
        return { ok: true };
      },
      adjustPoints,
      markAnnouncementRead,
      updatePreferences,
    }),
    [
      state,
      currentUser,
      currentPoints,
      unreadCount,
      authInitializing,
      login,
      logout,
      completeAccountSetup,
      saveEvent,
      deleteEvent,
      toggleRsvp,
      toggleSchedule,
      submitAttendance,
      recordStudentQrAttendance,
      moderateAttendance,
      saveNote,
      moderateNote,
      toggleFavourite,
      markNotification,
      markAllNotifications,
      saveSubject,
      deleteSubject,
      adjustPoints,
      markAnnouncementRead,
      updatePreferences,
    ]
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppDataContextValue {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error("useAppData must be used within an AppDataProvider");
  }
  return context;
}

export function getUserPoints(state: DemoState, userId: string): number {
  return state.points
    .filter((p) => p.userId === userId)
    .reduce((sum, p) => sum + p.points, 0);
}

export function getRsvpCount(state: DemoState, eventId: string): number {
  return state.rsvps.filter((r) => r.eventId === eventId).length;
}

export function effectiveEventStatus(event: DemoEvent): SessionStatus {
  const now = Date.now();
  const start = new Date(event.date).getTime();
  const end = new Date(event.endDate).getTime();
  if (event.status === "Cancelled" || event.status === "Draft") return event.status;
  if (now >= start && now <= end) return "Live";
  if (now > end) return "Completed";
  return "Upcoming";
}
