import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { HashRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import App from "../app/App";
import { AppDataProvider, appDataReducer } from "../context/AppDataContext";
import { createSeedState, DEMO_STORAGE_KEY } from "../data/seed";
import { attendanceService } from "../services";
import { isValidOpaqueQrToken } from "../features/attendance/qr";
import * as authAdapter from "../services/supabase/authAdapter";

function renderApp() {
  return render(<HashRouter><AppDataProvider><App /></AppDataProvider></HashRouter>);
}

describe("core front-end demo workflows", () => {
  afterEach(() => { cleanup(); vi.restoreAllMocks(); });
  beforeEach(() => {
    window.localStorage.clear();
    window.location.hash = "#/login";
  });

  it("validates an invalid Student ID", async () => {
    renderApp();
    fireEvent.change(screen.getByLabelText("Student ID"), { target: { value: "invalid" } });
    fireEvent.click(screen.getByRole("button", { name: "Login" }));
    expect(await screen.findByText("Invalid Student ID format. Use YY-XXXX-ZZ.", { selector: ".inline-notice-body" })).toBeInTheDocument();
  });

  it("requires first-login account setup and persists completion", async () => {
    vi.spyOn(authAdapter, "signInStudent").mockResolvedValue({
      account: {
        user: { id: "11111111-1111-4111-8111-111111111111", email: "2024-00421@cpucss.edu.ph" },
        profile: {
          id: "11111111-1111-4111-8111-111111111111",
          studentId: "2024-00421",
          name: "Aria Cruz",
          role: "student",
          yearLevel: "Freshman",
          program: "BS Computer Science",
          section: "A",
          active: true,
          mustChangePassword: true,
          accountSetupCompleted: false,
        },
      },
      error: null,
    });
    vi.spyOn(authAdapter, "updatePassword").mockResolvedValue({ error: null });
    renderApp();
    fireEvent.change(screen.getByLabelText("Student ID"), { target: { value: "2024-00421" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "202400421" } });
    fireEvent.click(screen.getByRole("button", { name: "Login" }));
    expect(await screen.findByRole("heading", { name: /Welcome, Aria/i })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Create password"), { target: { value: "SecurePass1" } });
    fireEvent.change(screen.getByLabelText("Confirm password"), { target: { value: "SecurePass1" } });
    fireEvent.click(screen.getByRole("button", { name: /Save and Continue/i }));
    await waitFor(() => expect(screen.queryByRole("heading", { name: /Welcome, Aria/i })).not.toBeInTheDocument());
    const stored = JSON.parse(window.localStorage.getItem(DEMO_STORAGE_KEY) ?? "{}");
    expect(stored.users.find((user: { id: string }) => user.id === "stu-042").accountSetup.completed).toBe(true);
  });

  it("defers the password prompt once and moves the action to Notifications", async () => {
    vi.spyOn(authAdapter, "deferPasswordChange").mockResolvedValue({ error: null });
    const seed = createSeedState();
    seed.currentUserId = "stu-042";
    const student = seed.users.find((user) => user.id === "stu-042");
    if (student) student.accountSetup = { completed: false, mustChangePassword: true };
    window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(seed));
    window.location.hash = "#/dashboard";

    const firstView = renderApp();
    expect(await screen.findByRole("heading", { name: /Welcome, Aria/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "I'll do it later" }));
    await waitFor(() => expect(screen.queryByRole("heading", { name: /Welcome, Aria/i })).not.toBeInTheDocument());
    const stored = JSON.parse(window.localStorage.getItem(DEMO_STORAGE_KEY) ?? "{}");
    expect(stored.users.find((user: { id: string }) => user.id === "stu-042").accountSetup.skipped).toBe(true);

    firstView.unmount(); cleanup();
    window.location.hash = "#/notifications";
    renderApp();
    expect(await screen.findByText("Change your temporary password")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Welcome, Aria/i })).not.toBeInTheDocument();
  });

  it("closes the password reminder after the password is changed", async () => {
    vi.spyOn(authAdapter, "updatePassword").mockResolvedValue({ error: null });
    const seed = createSeedState();
    seed.currentUserId = "stu-042";
    const student = seed.users.find((user) => user.id === "stu-042");
    if (student) student.accountSetup = {
      completed: false,
      skipped: true,
      mustChangePassword: true,
      promptDismissedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(seed));
    window.location.hash = "#/settings";

    const settingsView = renderApp();
    fireEvent.change(await screen.findByLabelText("New password"), { target: { value: "SecurePass1" } });
    fireEvent.change(screen.getByLabelText("Confirm password"), { target: { value: "SecurePass1" } });
    fireEvent.click(screen.getByRole("button", { name: /Update Security/i }));
    await waitFor(() => {
      const stored = JSON.parse(window.localStorage.getItem(DEMO_STORAGE_KEY) ?? "{}");
      expect(stored.users.find((user: { id: string }) => user.id === "stu-042").accountSetup.completed).toBe(true);
    });

    settingsView.unmount(); cleanup();
    window.location.hash = "#/notifications";
    renderApp();
    await waitFor(() => expect(screen.queryByText("Change your temporary password")).not.toBeInTheDocument());
  });

  it("updates RSVP state through the centralized reducer", () => {
    const seed = createSeedState();
    const next = appDataReducer(seed, { type: "TOGGLE_RSVP", userId: "stu-208", eventId: "evt-1" });
    expect(next.rsvps.some((item) => item.userId === "stu-208" && item.eventId === "evt-1")).toBe(true);
    expect(next.scheduleEventIds["stu-208"] ?? []).not.toContain("evt-1");
  });

  it("awards points when a pending note is approved", () => {
    const seed = createSeedState();
    const before = seed.points.filter((item) => item.userId === "stu-042").reduce((sum, item) => sum + item.points, 0);
    const next = appDataReducer(seed, { type: "MODERATE_NOTE", noteId: "n3", status: "Approved", reviewerId: "adm-001" });
    const after = next.points.filter((item) => item.userId === "stu-042").reduce((sum, item) => sum + item.points, 0);
    expect(next.notes.find((item) => item.id === "n3")?.status).toBe("Approved");
    expect(after - before).toBe(60);
    expect(next.notifications.some((item) => item.userId === "stu-042" && item.title === "Note approved")).toBe(true);
  });

  it("marks persistent notifications as read", () => {
    const seed = createSeedState();
    const next = appDataReducer(seed, { type: "MARK_NOTIFICATION", id: "notif-1", read: true });
    expect(next.notifications.find((item) => item.id === "notif-1")?.readAt).toBeTruthy();
  });

  it("creates and deletes a session in the centralized store", () => {
    const seed = createSeedState();
    const event = { ...seed.events[0], id: "evt-test", title: "Test Session" };
    const created = appDataReducer(seed, { type: "UPSERT_EVENT", event });
    expect(created.events.some((item) => item.id === "evt-test")).toBe(true);
    const deleted = appDataReducer(created, { type: "DELETE_EVENT", eventId: "evt-test" });
    expect(deleted.events.some((item) => item.id === "evt-test")).toBe(false);
  });

  it("detects duplicate attendance before another record is submitted", () => {
    const seed = createSeedState();
    expect(attendanceService.hasDuplicate(seed, "stu-042", "evt-3")).toBe(true);
    expect(attendanceService.hasDuplicate(seed, "stu-208", "evt-3")).toBe(false);
  });

  it("validates opaque single-use server QR tokens without client identity fields", () => {
    const validServerToken = "a1b2c3d4e5f67890123456789abcdef0a1b2c3d4e5f67890123456789abcdef0";
    expect(isValidOpaqueQrToken(validServerToken)).toBe(true);
    expect(isValidOpaqueQrToken("")).toBe(false);
    expect(isValidOpaqueQrToken("https://example.com/not-an-attendance-code")).toBe(false);
  });

  it("opens the student's personal attendance QR from the mobile dock", async () => {
    const seed = createSeedState(); seed.currentUserId = "stu-042";
    const student = seed.users.find((user) => user.id === "stu-042");
    if (student) student.authUserId = "3cf559c4-b961-4f59-965a-60fab82ed1ca";
    window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(seed));
    window.location.hash = "#/dashboard";
    const view = renderApp();
    await waitFor(() => expect(view.container.querySelector("#main-content")).toBeInTheDocument());
    const dockButtons = view.container.querySelectorAll(".mobile-nav-bar > button");
    expect(dockButtons).toHaveLength(2);
    expect(Array.from(dockButtons).map((button) => button.getAttribute("aria-label"))).toEqual(["My attendance QR", "More"]);
    fireEvent.click(screen.getByRole("button", { name: "My attendance QR" }));
    expect(await screen.findByRole("dialog", { name: "My attendance QR" })).toBeInTheDocument();
    expect(view.container.querySelector(".qr-mode-code-panel svg")).toBeInTheDocument();
  });

  it("stores note rejection feedback for resubmission", () => {
    const seed = createSeedState();
    const next = appDataReducer(seed, { type: "MODERATE_NOTE", noteId: "n3", status: "Rejected", reviewerId: "adm-001", reason: "Add source references." });
    expect(next.notes.find((item) => item.id === "n3")?.rejectionReason).toBe("Add source references.");
  });

  it("persists a student's personally selected favourite", () => {
    const seed = createSeedState();
    const next = appDataReducer(seed, { type: "TOGGLE_FAVOURITE", userId: "stu-208", noteId: "n1" });
    expect(next.favouriteNoteIds["stu-208"]).toContain("n1");
  });

  it("records a transparent administrator point adjustment", () => {
    const seed = createSeedState();
    const next = appDataReducer(seed, { type: "ADJUST_POINTS", adminId: "adm-001", transaction: { id: "pt-test", userId: "stu-208", points: -10, reason: "Demo correction", createdAt: new Date().toISOString(), relatedType: "Adjustment" } });
    expect(next.points.find((item) => item.id === "pt-test")?.points).toBe(-10);
    expect(next.notifications.some((item) => item.userId === "stu-208" && item.title === "Points adjusted")).toBe(true);
  });

  it("loads every main student route directly after a refresh", async () => {
    const seed = createSeedState(); seed.currentUserId = "stu-117";
    const routes = ["dashboard", "events", "schedule", "attendance", "leaderboard", "notes", "my-notes", "favourites", "points-history", "notifications", "announcements", "help", "profile", "settings"];
    for (const route of routes) {
      window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(seed)); window.location.hash = `#/${route}`;
      const view = renderApp();
      await waitFor(() => expect(view.container.querySelector("#main-content")).toBeInTheDocument());
      view.unmount(); cleanup();
    }
  });

  it("loads every main admin route directly after a refresh", async () => {
    const seed = createSeedState(); seed.currentUserId = "adm-001";
    const routes = ["admin", "admin/attendance", "admin/sessions", "admin/notes", "admin/students", "admin/subjects"];
    for (const route of routes) {
      window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(seed)); window.location.hash = `#/${route}`;
      const view = renderApp();
      await waitFor(() => expect(view.container.querySelector("#main-content")).toBeInTheDocument());
      view.unmount(); cleanup();
    }
  });
});
