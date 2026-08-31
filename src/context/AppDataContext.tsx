import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState } from "react";
import { queueMutation } from "../offline/outboxRepository";
import { clearUserOfflineCache } from "../offline/database";
import { setupAutoSync } from "../sync/syncEngine";
import {
  getSessions,
  saveSession,
  deleteSession as deleteSessionFromSupabase,
  getUserRsvps,
  getSavedSessionIds,
  setSavedSession,
  setRsvp as setRsvpInSupabase,
  getSubjects,
  upsertSubject as upsertSubjectInSupabase,
  deleteSubjectRecord as deleteSubjectRecordInSupabase,
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
  saveNoteDraft,
  replaceNoteFile,
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
  signOut as signOutFromSupabase,
  updatePassword,
  deferPasswordChange,
  subscribeToAuth,
} from "../services/supabase/authAdapter";
import type { AuthProfile } from "../services/supabase/authAdapter";
import {
  adminUpdateProfile as adminUpdateProfileInSupabase,
  getMyPreferences,
  getProfiles,
  saveMyPreferences,
} from "../services/supabase/profileRepository";

import { createEmptyState, createSeedState, DEMO_STATE_VERSION, DEMO_STORAGE_KEY } from "../data/seed";
import type {
  AttendanceRecord,
  DemoEvent,
  DemoNote,
  DemoNotification,
  DemoState,
  DemoUser,
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
  | { type: "SET_ACCOUNT_SETUP"; userId: string; completed: boolean; skipped: boolean; promptDismissedAt?: string }
  | { type: "UPSERT_EVENT"; event: DemoEvent }
  | { type: "DELETE_EVENT"; eventId: string }
  | { type: "SET_EVENTS"; events: DemoEvent[] }
  | { type: "SET_SUBJECTS"; subjects: Subject[] }
  | { type: "SET_RSVPS"; rsvps: DemoState["rsvps"] }
  | { type: "TOGGLE_RSVP"; userId: string; eventId: string }
  | { type: "TOGGLE_SCHEDULE"; userId: string; eventId: string }
  | { type: "SET_SCHEDULE"; userId: string; eventIds: string[] }
  | { type: "ADD_ATTENDANCE"; record: AttendanceRecord }
  | { type: "SET_ATTENDANCE"; attendance: AttendanceRecord[] }
  | { type: "MODERATE_ATTENDANCE"; recordId: string; status: "Approved" | "Rejected"; reviewerId: string; correctionNote?: string }
  | { type: "UPSERT_NOTE"; note: DemoNote }
  | { type: "SET_NOTES"; notes: DemoNote[] }
  | { type: "MERGE_NOTES"; notes: DemoNote[] }
  | { type: "RECONCILE_NOTES"; notes: DemoNote[]; statuses: DemoNote["status"][] }
  | { type: "RECONCILE_MY_NOTES"; notes: DemoNote[]; userIds: string[] }
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
  | { type: "MERGE_USERS"; users: DemoUser[] }
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
    case "SET_ACCOUNT_SETUP":
      return {
        ...state,
        users: state.users.map((u) =>
          u.id === action.userId
            ? {
                ...u,
                accountSetup: {
                  completed: action.completed,
                  completedAt: action.completed ? new Date().toISOString() : undefined,
                  skipped: action.skipped,
                  mustChangePassword: !action.completed,
                  promptDismissedAt: action.promptDismissedAt,
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
    case "SET_SCHEDULE":
      return {
        ...state,
        scheduleEventIds: {
          ...state.scheduleEventIds,
          [action.userId]: action.eventIds,
        },
      };
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
    case "MERGE_NOTES":
      return {
        ...state,
        notes: Array.from(
          new Map([...state.notes, ...action.notes].map((note) => [note.id, note])).values()
        ),
      };
    case "RECONCILE_NOTES": {
      const incomingIds = new Set(action.notes.map((note) => note.id));
      const retained = state.notes.filter(
        (note) => !action.statuses.includes(note.status) || incomingIds.has(note.id)
      );
      return {
        ...state,
        notes: Array.from(new Map([...retained, ...action.notes].map((note) => [note.id, note])).values()),
      };
    }
    case "RECONCILE_MY_NOTES": {
      const incomingIds = new Set(action.notes.map((note) => note.id));
      const retained = state.notes.filter(
        (note) => !action.userIds.includes(note.uploaderId) || incomingIds.has(note.id)
      );
      return {
        ...state,
        notes: Array.from(new Map([...retained, ...action.notes].map((note) => [note.id, note])).values()),
      };
    }
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
    case "MERGE_USERS": {
      const users = [...state.users];
      for (const incoming of action.users) {
        const index = users.findIndex(
          (user) => user.id === incoming.id || user.authUserId === incoming.authUserId || user.studentId === incoming.studentId
        );
        if (index >= 0) {
          users[index] = { ...users[index], ...incoming, id: users[index].id };
        } else {
          users.push(incoming);
        }
      }
      return { ...state, users };
    }
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
  login: (studentId: string, profile: AuthProfile, authUserId: string, email: string) => Result;
  logout: () => void;
  completeAccountSetup: (password: string, skip?: boolean) => Promise<Result>;
  saveEvent: (input: Partial<DemoEvent> & Pick<DemoEvent, "title" | "subjectId" | "date" | "endDate" | "venue" | "capacity">) => Promise<Result>;
  deleteEvent: (eventId: string) => Promise<Result>;
  toggleRsvp: (eventId: string) => Promise<Result>;
  toggleSchedule: (eventId: string) => Promise<Result>;
  submitAttendance: (eventId: string, code: string, method?: "Code" | "QR") => Promise<Result>;
  recordStudentQrAttendance: (eventId: string, token: string) => Promise<Result & { studentName?: string; studentId?: string }>;
  moderateAttendance: (recordId: string, status: "Approved" | "Rejected", note?: string) => Promise<Result>;
  saveNote: (input: Partial<DemoNote> & Pick<DemoNote, "title" | "subjectId" | "description">, submit?: boolean, file?: File | null) => Promise<Result & { noteId?: string; note?: DemoNote }>;
  moderateNote: (noteId: string, status: "Approved" | "Rejected", reason?: string) => Promise<Result>;
  toggleFavourite: (noteId: string) => Promise<Result>;
  markNotification: (id: string, read?: boolean) => Promise<Result>;
  markAllNotifications: () => Promise<Result>;
  deleteNotification: (id: string) => Result;
  clearNotifications: () => Result;
  saveSubject: (input: Partial<Subject> & Pick<Subject, "code" | "name" | "yearLevel">) => Promise<Result>;
  deleteSubject: (id: string) => Promise<Result>;
  saveUser: (user: DemoUser) => Promise<Result>;
  adjustPoints: (userId: string, points: number, reason: string) => Promise<Result>;
  markAnnouncementRead: (announcementId: string) => Promise<Result>;
  updatePreferences: (preferences: Preferences) => Promise<Result>;
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
    return import.meta.env.MODE === "production" ? createEmptyState() : createSeedState();
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

  // Listen to Supabase auth state changes
  useEffect(() => {
    const unsubscribe = subscribeToAuth((account) => {
      if (account) {
        const studentId = account.profile.studentId.toUpperCase();
        let matchedUser = state.users.find((u) => u.studentId.toUpperCase() === studentId || u.authUserId === account.user.id);

        const mustChangePassword = Boolean(account.profile.mustChangePassword);
        const completed = Boolean(account.profile.accountSetupCompleted) || !mustChangePassword;
        const accountSetup = {
          completed,
          skipped: !completed && Boolean(account.profile.passwordPromptDismissedAt),
          mustChangePassword,
          promptDismissedAt: account.profile.passwordPromptDismissedAt,
        };

        if (!matchedUser) {
          matchedUser = {
            id: account.profile.id,
            authUserId: account.user.id,
            studentId,
            name: account.profile.name || "Student",
            email: account.user.email || `${studentId.toLowerCase()}@cpu.edu.ph`,
            role: account.profile.role || "student",
            yearLevel: account.profile.yearLevel || "Freshman",
            program: account.profile.program || "BS Computer Science",
            section: account.profile.section || "A",
            active: account.profile.active,
            accountSetup,
          };
          dispatch({ type: "MERGE_USERS", users: [matchedUser] });
        } else {
          matchedUser = {
            ...matchedUser,
            authUserId: account.user.id,
            name: account.profile.name || matchedUser.name,
            email: account.user.email || matchedUser.email,
            role: account.profile.role,
            yearLevel: account.profile.yearLevel,
            program: account.profile.program,
            section: account.profile.section,
            active: account.profile.active,
            accountSetup,
          };
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
          dispatch({ type: "SET_ANNOUNCEMENTS", announcements: annRes.data });
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
              completed: p.accountSetupCompleted || !p.mustChangePassword,
              skipped: !p.accountSetupCompleted && p.mustChangePassword && Boolean(p.passwordPromptDismissedAt),
              mustChangePassword: p.mustChangePassword,
              promptDismissedAt: p.passwordPromptDismissedAt,
            },
          }));
          dispatch({ type: "MERGE_USERS", users });
        }
      } catch (err) {
        console.warn("Could not refresh application data.", err);
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

  const loadSharedRecords = useCallback(async () => {
    try {
      const [subjectsResult, sessionsResult, approvedResult, announcementsResult] = await Promise.all([
        getSubjects(),
        getSessions(),
        getApprovedNotes(),
        getAnnouncements(),
      ]);
      const pendingResult = currentUser?.role === "admin" ? await getPendingNotes() : null;

      if (subjectsResult.data) dispatch({ type: "SET_SUBJECTS", subjects: subjectsResult.data });
      if (sessionsResult.data) dispatch({ type: "SET_EVENTS", events: sessionsResult.data });
      if (approvedResult.data) {
        dispatch({ type: "RECONCILE_NOTES", notes: approvedResult.data, statuses: ["Approved"] });
      }
      if (pendingResult?.data) {
        dispatch({ type: "RECONCILE_NOTES", notes: pendingResult.data, statuses: ["Pending"] });
      }
      if (announcementsResult.data) dispatch({ type: "SET_ANNOUNCEMENTS", announcements: announcementsResult.data });
    } catch (error) {
      console.warn("Could not refresh shared records.", error);
    }
  }, [currentUser?.role]);

  const loadUserRecords = useCallback(async () => {
    if (!currentUser) return;
    const userId = currentUser.authUserId || currentUser.id;

    try {
      const [rsvpsRes, savedSessionsRes, preferencesRes, attRes, myNotesRes, favsRes, pointsRes, notifsRes] =
        await Promise.all([
          getUserRsvps(currentUser.role === "admin" ? undefined : userId),
          currentUser.role === "admin" ? Promise.resolve({ data: [], error: null }) : getSavedSessionIds(),
          getMyPreferences(),
          getAttendance(currentUser.role === "admin" ? undefined : userId),
          getMyNotes(userId),
          getFavoriteNoteIds(),
          getPointHistory(userId),
          getNotifications(userId),
        ]);

      if (rsvpsRes.data) dispatch({ type: "SET_RSVPS", rsvps: rsvpsRes.data });
      if (savedSessionsRes.data) dispatch({ type: "SET_SCHEDULE", userId: currentUser.id, eventIds: savedSessionsRes.data });
      if (preferencesRes.data) dispatch({ type: "UPDATE_PREFERENCES", userId: currentUser.id, preferences: preferencesRes.data });
      if (attRes.data) dispatch({ type: "SET_ATTENDANCE", attendance: attRes.data });
      if (myNotesRes.data) dispatch({ type: "RECONCILE_MY_NOTES", notes: myNotesRes.data, userIds: [currentUser.id, userId] });
      if (favsRes.data) {
        dispatch({ type: "SET_FAVOURITES", userId: currentUser.id, noteIds: favsRes.data });
      }
      if (pointsRes.data) dispatch({ type: "SET_POINTS", points: pointsRes.data });
      if (notifsRes.data) dispatch({ type: "SET_NOTIFICATIONS", notifications: notifsRes.data });
    } catch (error) {
      console.warn("Could not refresh account data.", error);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) void loadSharedRecords();
  }, [currentUser, loadSharedRecords]);

  useEffect(() => {
    void loadUserRecords();
  }, [loadUserRecords]);

  // Queue processing is always partitioned by the authenticated user. Refresh
  // authorized records on reconnect, focus, and a conservative visible-tab poll.
  useEffect(() => {
    if (!currentUser) return;
    const userId = currentUser.authUserId || currentUser.id;
    return setupAutoSync(userId);
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const refreshUser = () => {
      if (navigator.onLine && document.visibilityState === "visible") void loadUserRecords();
    };
    const refreshAll = () => {
      if (navigator.onLine && document.visibilityState === "visible") {
        void Promise.all([loadUserRecords(), loadSharedRecords()]);
      }
    };
    const intervalId = window.setInterval(refreshUser, 60000);
    window.addEventListener("online", refreshAll);
    window.addEventListener("focus", refreshAll);
    document.addEventListener("visibilitychange", refreshAll);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("online", refreshAll);
      window.removeEventListener("focus", refreshAll);
      document.removeEventListener("visibilitychange", refreshAll);
    };
  }, [currentUser, loadSharedRecords, loadUserRecords]);

  const currentPoints = useMemo(() => {
    if (!currentUser) return 0;
    return state.points
      .filter((p) => p.userId === currentUser.id || p.userId === currentUser.authUserId)
      .reduce((sum, p) => sum + p.points, 0);
  }, [currentUser, state.points]);

  const unreadCount = useMemo(() => {
    if (!currentUser) return 0;
    const accountReminder = currentUser.accountSetup.mustChangePassword && currentUser.accountSetup.skipped ? 1 : 0;
    return accountReminder + state.notifications.filter(
      (n) => (n.userId === currentUser.id || n.userId === currentUser.authUserId) && !n.readAt
    ).length;
  }, [currentUser, state.notifications]);

  const login = useCallback(
    (studentId: string, profile: AuthProfile, authUserId: string, email: string): Result => {
      const normalizedId = studentId.trim().toUpperCase();
      if (!/^\d{2}-\d{4}-\d{2}(?:-ADMIN)?$/i.test(normalizedId) && !/^\d{4}-\d{5}$/.test(normalizedId)) {
        return { ok: false, message: "Invalid Student ID format." };
      }

      let user = state.users.find(
        (u) => u.studentId.toUpperCase() === normalizedId || u.authUserId === authUserId
      );

      const mustChangePassword = Boolean(profile.mustChangePassword);
      const completed = Boolean(profile.accountSetupCompleted) || !mustChangePassword;
      const accountSetup = {
        completed,
        skipped: !completed && Boolean(profile.passwordPromptDismissedAt),
        mustChangePassword,
        promptDismissedAt: profile.passwordPromptDismissedAt,
      };

      if (!user) {
        user = {
          id: profile.id,
          authUserId,
          studentId: normalizedId,
          name: profile.name,
          email,
          role: profile.role,
          yearLevel: profile.yearLevel,
          program: profile.program,
          section: profile.section,
          active: profile.active,
          accountSetup,
        };
        dispatch({ type: "MERGE_USERS", users: [user] });
      } else {
        user = {
          ...user,
          authUserId,
          name: profile.name,
          email,
          role: profile.role,
          yearLevel: profile.yearLevel,
          program: profile.program,
          section: profile.section,
          active: profile.active,
          accountSetup,
        };
        dispatch({ type: "UPDATE_USER", user });
      }

      if (!user.active) {
        return { ok: false, message: "This account has been deactivated. Contact an administrator." };
      }

      dispatch({ type: "LOGIN", userId: user.id });
      return { ok: true };
    },
    [state.users]
  );

  const logout = useCallback(() => {
    const userId = currentUser?.authUserId || currentUser?.id;
    dispatch({ type: "LOGOUT" });
    void Promise.allSettled([
      signOutFromSupabase(),
      userId ? clearUserOfflineCache(userId) : Promise.resolve(),
    ]);
  }, [currentUser]);

  const completeAccountSetup = useCallback(
    async (password: string, skip = false): Promise<Result> => {
      if (!currentUser) return { ok: false, message: "No active session" };

      if (skip) {
        const res = await deferPasswordChange();
        if (res.error) {
          return { ok: false, message: res.error };
        }
        const dismissedAt = new Date().toISOString();
        dispatch({
          type: "SET_ACCOUNT_SETUP",
          userId: currentUser.id,
          completed: false,
          skipped: true,
          promptDismissedAt: dismissedAt,
        });
        return { ok: true };
      }

      if (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) {
        return { ok: false, message: "Use at least 8 characters with uppercase, lowercase, and a number." };
      }

      const res = await updatePassword(password);
      if (res.error) {
        return { ok: false, message: res.error || "Failed to update password." };
      }

      dispatch({
        type: "SET_ACCOUNT_SETUP",
        userId: currentUser.id,
        completed: true,
        skipped: false,
      });
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
              message: existing ? "Your cancellation will be submitted when you are back online." : "Your reservation will be submitted when you are back online.",
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
    async (eventId: string): Promise<Result> => {
      if (!currentUser || currentUser.role === "admin") {
        return { ok: false, message: "Sign in as a student to manage a schedule." };
      }
      const userId = currentUser.authUserId || currentUser.id;
      const saved = (state.scheduleEventIds[currentUser.id] || []).includes(eventId);
      dispatch({ type: "TOGGLE_SCHEDULE", userId: currentUser.id, eventId });

      try {
        const result = await setSavedSession(eventId, !saved);
        if (result.error) {
          if (!navigator.onLine || result.error.includes("Failed to fetch")) {
            await queueMutation(userId, "schedule", eventId, "set", { sessionId: eventId, saved: !saved });
            return { ok: true, message: "Your schedule change will be saved when you are back online." };
          }
          dispatch({ type: "TOGGLE_SCHEDULE", userId: currentUser.id, eventId });
          return { ok: false, message: result.error };
        }
      } catch {
        await queueMutation(userId, "schedule", eventId, "set", { sessionId: eventId, saved: !saved });
        return { ok: true, message: "Your schedule change will be saved when you are back online." };
      }
      return { ok: true, message: saved ? "Removed from your schedule." : "Added to your schedule." };
    },
    [currentUser, state.scheduleEventIds]
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
          return { ok: true, message: "Your attendance will be submitted when you are back online." };
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
      submit = true,
      file?: File | null
    ): Promise<Result & { noteId?: string; note?: DemoNote }> => {
      if (!currentUser || currentUser.role === "admin") {
        return { ok: false, message: "Sign in as a student to save notes." };
      }
      if (!input.title.trim() || !input.subjectId) {
        return { ok: false, message: "Add a title and subject." };
      }
      if (submit && !file && !input.fileId) {
        return { ok: false, message: "Attach a file before submitting." };
      }

      const draftResult = await saveNoteDraft({
        noteId: input.id,
        title: input.title.trim(),
        subjectId: input.subjectId,
        description: input.description.trim(),
        tags: input.tags || [],
      });

      if (draftResult.error || !draftResult.data) {
        return { ok: false, message: draftResult.error || "The draft could not be saved." };
      }

      let savedNote: DemoNote = {
        ...draftResult.data,
        fileName: input.fileName,
        fileType: input.fileType,
        fileId: input.fileId,
      };
      dispatch({ type: "UPSERT_NOTE", note: savedNote });

      if (file) {
        const uploadResult = await replaceNoteFile(savedNote.id, file);
        if (uploadResult.error || !uploadResult.file) {
          return {
            ok: false,
            noteId: savedNote.id,
            note: savedNote,
            message: `Draft saved, but the file could not be uploaded: ${uploadResult.error || "Unknown file error"}`,
          };
        }
        savedNote = {
          ...savedNote,
          fileName: uploadResult.file.name,
          fileType: uploadResult.file.type,
          fileId: uploadResult.file.path,
        };
      }

      if (submit) {
        const submitResult = await submitNoteToSupabase(savedNote.id);
        if (submitResult.error || !submitResult.data) {
          dispatch({ type: "UPSERT_NOTE", note: savedNote });
          return {
            ok: false,
            noteId: savedNote.id,
            note: savedNote,
            message: `Draft saved, but it could not be submitted: ${submitResult.error || "Unknown submission error"}`,
          };
        }
        savedNote = {
          ...submitResult.data,
          fileName: savedNote.fileName,
          fileType: savedNote.fileType,
          fileId: savedNote.fileId,
        };
      }

      dispatch({ type: "UPSERT_NOTE", note: savedNote });
      return {
        ok: true,
        noteId: savedNote.id,
        note: savedNote,
        message: submit ? "Note submitted for moderation." : "Draft saved.",
      };
    },
    [currentUser]
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

      const result = await toggleNoteFavorite(noteId, !isFav);
      if (result.error) return { ok: false, message: result.error };
      dispatch({ type: "TOGGLE_FAVOURITE", userId: currentUser.id, noteId });
      return { ok: true };
    },
    [currentUser, state.favouriteNoteIds, state.notes]
  );

  const saveSubject = useCallback(
    async (input: Partial<Subject> & Pick<Subject, "code" | "name" | "yearLevel">): Promise<Result> => {
      if (!input.code.trim() || !input.name.trim()) {
        return { ok: false, message: "Subject code and name are required." };
      }
      const subjectToSave: Subject = {
        id: input.id ?? uid("sub"),
        code: input.code.trim().toUpperCase(),
        name: input.name.trim(),
        yearLevel: input.yearLevel,
        coordinator: input.coordinator?.trim() || "TBD",
        active: input.active ?? true,
      };

      dispatch({
        type: "UPSERT_SUBJECT",
        subject: subjectToSave,
      });

      const res = await upsertSubjectInSupabase(subjectToSave);
      if (res.error && navigator.onLine && !res.error.includes("Failed to fetch")) {
        return { ok: false, message: res.error };
      }
      return { ok: true };
    },
    []
  );

  const deleteSubject = useCallback(
    async (id: string): Promise<Result> => {
      if (
        state.events.some((event) => event.subjectId === id) ||
        state.notes.some((note) => note.subjectId === id)
      ) {
        return { ok: false, message: "This subject is in use and cannot be deleted." };
      }
      dispatch({ type: "DELETE_SUBJECT", subjectId: id });

      const res = await deleteSubjectRecordInSupabase(id);
      if (res.error && navigator.onLine && !res.error.includes("Failed to fetch")) {
        return { ok: false, message: res.error };
      }
      return { ok: true };
    },
    [state.events, state.notes]
  );

  const saveUser = useCallback(
    async (user: DemoUser): Promise<Result> => {
      dispatch({ type: "UPDATE_USER", user });
      const res = await adminUpdateProfileInSupabase(user.id, {
        name: user.name,
        section: user.section,
        program: user.program,
        yearLevel: user.yearLevel,
        active: user.active,
        role: user.role,
      });
      if (res.error && navigator.onLine && !res.error.includes("Failed to fetch")) {
        return { ok: false, message: res.error };
      }
      return { ok: true };
    },
    []
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
    const result = await markNotificationAsRead(id, read);
    if (result.error) return { ok: false, message: result.error.message || "Notification was not updated." };
    dispatch({ type: "MARK_NOTIFICATION", id, read });
    return { ok: true };
  }, []);

  const markAllNotifications = useCallback(async (): Promise<Result> => {
    if (!currentUser) return { ok: false, message: "Not logged in" };
    const result = await markAllNotificationsAsRead(currentUser.authUserId || currentUser.id);
    if (result.error) return { ok: false, message: result.error.message || "Notifications were not updated." };
    dispatch({ type: "MARK_ALL_NOTIFICATIONS", userId: currentUser.id });
    return { ok: true };
  }, [currentUser]);

  const markAnnouncementRead = useCallback(
    async (announcementId: string): Promise<Result> => {
      if (!currentUser) return { ok: false, message: "Not logged in" };
      const result = await markAnnouncementAsReadInSupabase(announcementId);
      if (result.error) return { ok: false, message: result.error.message || "Announcement was not updated." };
      dispatch({ type: "MARK_ANNOUNCEMENT", announcementId, userId: currentUser.id });
      return { ok: true };
    },
    [currentUser]
  );

  const updatePreferences = useCallback(
    async (preferences: Preferences): Promise<Result> => {
      if (!currentUser) return { ok: false, message: "Not logged in" };
      const result = await saveMyPreferences(preferences);
      if (result.error) return { ok: false, message: result.error };
      dispatch({ type: "UPDATE_PREFERENCES", userId: currentUser.id, preferences });
      return { ok: true, message: "Preferences saved." };
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
      saveUser,
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
      saveUser,
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
