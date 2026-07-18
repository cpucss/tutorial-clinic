import type { DemoEvent, DemoNote, DemoNotification, DemoState, DemoUser } from "../types/app";

// Future backend integration can replace these synchronous mock implementations
// while keeping the UI-facing method names stable.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

export const authService = {
  loginStudent(state: DemoState, studentId: string): DemoUser | undefined {
    return state.users.find((user) => user.active && user.studentId.toUpperCase() === studentId.trim().toUpperCase());
  },
  getCurrentStudent(state: DemoState): DemoUser | undefined {
    return state.users.find((user) => user.id === state.currentUserId);
  },
  setBackupEmailAndPassword(user: DemoUser, backupEmail: string, password: string): DemoUser {
    return { ...user, accountSetup: { completed: true, backupEmail, demoPassword: password, completedAt: new Date().toISOString() } };
  },
};

export const studentService = {
  list(state: DemoState) { return state.users.filter((user) => user.role !== "admin"); },
  getById(state: DemoState, id: string) { return state.users.find((user) => user.id === id); },
};

export const eventService = {
  getEvents(state: DemoState): DemoEvent[] { return state.events; },
  getById(state: DemoState, id: string) { return state.events.find((event) => event.id === id); },
  createOrUpdateEvent(_state: DemoState, event: DemoEvent) { return event; },
  deleteEvent(state: DemoState, eventId: string) { return state.events.filter((event) => event.id !== eventId); },
  submitRsvp(state: DemoState, userId: string, eventId: string) { return state.rsvps.some((item) => item.userId === userId && item.eventId === eventId); },
};

export const attendanceService = {
  listForStudent(state: DemoState, userId: string) { return state.attendance.filter((item) => item.userId === userId); },
  validateCode(event: DemoEvent, code: string) { return event.attendanceCode.toUpperCase() === code.trim().toUpperCase(); },
  hasDuplicate(state: DemoState, userId: string, eventId: string) { return state.attendance.some((item) => item.userId === userId && item.eventId === eventId && item.status !== "Rejected"); },
  submitAttendance(state: DemoState, userId: string, eventId: string) { return !attendanceService.hasDuplicate(state, userId, eventId); },
  moderateAttendance(state: DemoState, recordId: string) { return state.attendance.find((item) => item.id === recordId); },
};

export const notesService = {
  getApproved(state: DemoState): DemoNote[] { return state.notes.filter((note) => note.status === "Approved"); },
  getForStudent(state: DemoState, userId: string): DemoNote[] { return state.notes.filter((note) => note.uploaderId === userId); },
  uploadNote(_state: DemoState, note: DemoNote) { return note; },
  submitNote(_state: DemoState, note: DemoNote) { return { ...note, status: "Pending" as const }; },
  moderateNote(_state: DemoState, note: DemoNote) { return note; },
};

export const notificationService = {
  getNotifications(state: DemoState, userId: string): DemoNotification[] { return state.notifications.filter((item) => item.userId === userId); },
  markNotificationAsRead(notification: DemoNotification) { return { ...notification, readAt: new Date().toISOString() }; },
  deleteNotification(state: DemoState, notificationId: string) { return state.notifications.filter((item) => item.id !== notificationId); },
};

export const pointsService = {
  getBalance(state: DemoState, userId: string) { return state.points.filter((item) => item.userId === userId).reduce((sum, item) => sum + item.points, 0); },
  getLeaderboard(state: DemoState) {
    return studentService.list(state).map((user) => ({ user, points: pointsService.getBalance(state, user.id) })).sort((a, b) => b.points - a.points);
  },
  updatePoints(state: DemoState, userId: string) { return pointsService.getBalance(state, userId); },
};
