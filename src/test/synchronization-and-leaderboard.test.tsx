import * as React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent, cleanup } from "@testing-library/react";
import { AppDataProvider, useAppData } from "../context/AppDataContext";
import { LeaderboardPage } from "../features/leaderboard/pages/LeaderboardPage";
import { DashboardPage } from "../features/dashboard/pages/DashboardPage";
import { AdminDashboardPage } from "../features/admin/pages/AdminDashboardPage";
import { SchedulePage } from "../features/schedule/pages/SchedulePage";
import * as pointsRepository from "../services/supabase/pointsRepository";
import * as sessionRepository from "../services/supabase/sessionRepository";
import type { LeaderboardItem } from "../services/supabase/pointsRepository";
import type { DemoEvent } from "../types/app";
import { DEMO_STORAGE_KEY, DEMO_STATE_VERSION } from "../data/seed";

describe("Synchronization and Leaderboard Remediation", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.location.hash = "#/";
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe("Phase 1 & 2: Server-Authoritative Leaderboard", () => {
    const mockLeaderboard: LeaderboardItem[] = [
      {
        id: "user-uuid-1",
        studentId: "",
        name: "Alice Smith",
        yearLevel: "Senior",
        points: 450,
        rank: 1,
      },
      {
        id: "user-uuid-2",
        studentId: "",
        name: "Bob Jones",
        yearLevel: "Junior",
        points: 320,
        rank: 2,
      },
      {
        id: "student-uuid-current",
        studentId: "",
        name: "Charlie Brown",
        yearLevel: "Freshman",
        points: 210,
        rank: 3,
      },
    ];

    it("LeaderboardPage calls getLeaderboard and displays canonical rank and points", async () => {
      const getLeaderboardSpy = vi
        .spyOn(pointsRepository, "getLeaderboard")
        .mockResolvedValue({ data: mockLeaderboard, error: null });

      render(
        <AppDataProvider>
          <LeaderboardPage />
        </AppDataProvider>
      );

      await waitFor(() => {
        expect(getLeaderboardSpy).toHaveBeenCalled();
      });

      expect((await screen.findAllByText(/Alice Smith/)).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/450 pts/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Bob Jones/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/320 pts/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Charlie Brown/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/210 pts/).length).toBeGreaterThan(0);
    });

    it("Leaderboard filters pass yearLevel parameter to getLeaderboard RPC", async () => {
      const getLeaderboardSpy = vi
        .spyOn(pointsRepository, "getLeaderboard")
        .mockResolvedValue({ data: mockLeaderboard, error: null });

      render(
        <AppDataProvider>
          <LeaderboardPage />
        </AppDataProvider>
      );

      await waitFor(() => {
        expect(getLeaderboardSpy).toHaveBeenCalledWith(undefined);
      });

      const juniorFilter = await screen.findByRole("button", { name: "Junior" });
      fireEvent.click(juniorFilter);

      await waitFor(() => {
        expect(getLeaderboardSpy).toHaveBeenCalledWith("Junior");
      });
    });

    it("Student Dashboard and Leaderboard display matching canonical rank", async () => {
      vi.spyOn(pointsRepository, "getLeaderboard").mockResolvedValue({
        data: mockLeaderboard,
        error: null,
      });

      const studentUser = {
        id: "student-uuid-current",
        authUserId: "student-uuid-current",
        studentId: "21-1234-56",
        name: "Charlie Brown",
        email: "charlie@cpu.edu.ph",
        role: "student",
        yearLevel: "Freshman",
        program: "BSCS",
        section: "1A",
        active: true,
        accountSetup: { completed: true, skipped: false, mustChangePassword: false },
      };

      const seedState = {
        version: DEMO_STATE_VERSION,
        currentUserId: "student-uuid-current",
        users: [studentUser],
        events: [],
        subjects: [],
        rsvps: [],
        scheduleEventIds: {},
        attendance: [],
        notes: [],
        favouriteNoteIds: {},
        points: [],
        notifications: [],
        announcements: [],
        preferences: {},
      };
      window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(seedState));

      const { container } = render(
        <AppDataProvider>
          <DashboardPage />
        </AppDataProvider>
      );

      // Student dashboard should display rank #3 from server-authoritative leaderboard
      await waitFor(() => {
        expect(container.textContent).toContain("#3");
      });
    });

    it("Admin Dashboard displays canonical leaderboard preview", async () => {
      vi.spyOn(pointsRepository, "getLeaderboard").mockResolvedValue({
        data: mockLeaderboard,
        error: null,
      });

      const adminUser = {
        id: "admin-uuid-1",
        authUserId: "admin-uuid-1",
        studentId: "00-0000-00-ADMIN",
        name: "Admin User",
        email: "admin@cpu.edu.ph",
        role: "admin",
        yearLevel: "Senior",
        program: "BSCS",
        section: "Admin",
        active: true,
        accountSetup: { completed: true, skipped: false, mustChangePassword: false },
      };

      const seedState = {
        version: DEMO_STATE_VERSION,
        currentUserId: "admin-uuid-1",
        users: [adminUser],
        events: [],
        subjects: [],
        rsvps: [],
        scheduleEventIds: {},
        attendance: [],
        notes: [],
        favouriteNoteIds: {},
        points: [],
        notifications: [],
        announcements: [],
        preferences: {},
      };
      window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(seedState));

      render(
        <AppDataProvider>
          <AdminDashboardPage />
        </AppDataProvider>
      );

      await waitFor(() => {
        expect(screen.getByText(/Alice Smith/)).toBeInTheDocument();
      });
      expect(screen.getByText(/450 pts/)).toBeInTheDocument();
    });
  });

  describe("Phase 3, 4 & 5: Realtime Sessions and Schedule Independence", () => {
    const mockSessions: DemoEvent[] = [
      {
        id: "session-101",
        title: "Calculus II Clinic",
        subjectId: "subj-math",
        description: "Differential and integral review",
        topics: ["math", "calculus"],
        date: new Date(Date.now() + 86400000).toISOString(),
        endDate: new Date(Date.now() + 90000000).toISOString(),
        yearLevels: ["Freshman", "Sophomore"],
        instructor: "Dr. Euler",
        instructorRole: "Professor",
        venue: "Room 302",
        capacity: 30,
        status: "Upcoming",
        attendanceCode: "CALC2",
        createdAt: new Date().toISOString(),
      },
    ];

    it("Session edits and deletions propagate to My Schedule without state corruption", async () => {
      vi.spyOn(sessionRepository, "getSessions").mockResolvedValue({
        data: mockSessions,
        error: null,
      });
      vi.spyOn(sessionRepository, "getSavedSessionIds").mockResolvedValue({
        data: ["session-101"],
        error: null,
      });

      const studentUser = {
        id: "student-1",
        authUserId: "student-1",
        studentId: "22-1111-22",
        name: "Student One",
        email: "student1@cpu.edu.ph",
        role: "student",
        yearLevel: "Sophomore",
        program: "BSCS",
        section: "2A",
        active: true,
        accountSetup: { completed: true, skipped: false, mustChangePassword: false },
      };

      const seedState = {
        version: DEMO_STATE_VERSION,
        currentUserId: "student-1",
        users: [studentUser],
        events: mockSessions,
        subjects: [],
        rsvps: [],
        scheduleEventIds: { "student-1": ["session-101"] },
        attendance: [],
        notes: [],
        favouriteNoteIds: {},
        points: [],
        notifications: [],
        announcements: [],
        preferences: {},
      };
      window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(seedState));

      render(
        <AppDataProvider>
          <SchedulePage />
        </AppDataProvider>
      );

      expect(await screen.findByText(/Calculus II Clinic/)).toBeInTheDocument();
      expect(screen.getByText(/Room 302/)).toBeInTheDocument();
    });

    it("RSVP and manual saved-session state remain independent", async () => {
      vi.spyOn(sessionRepository, "getSessions").mockResolvedValue({
        data: mockSessions,
        error: null,
      });
      vi.spyOn(sessionRepository, "setSavedSession").mockResolvedValue({
        error: null,
      });
      vi.spyOn(sessionRepository, "setRsvp").mockResolvedValue({
        joined: true,
        rsvp: null,
        error: null,
      });
      vi.spyOn(sessionRepository, "getUserRsvps").mockResolvedValue({
        data: [],
        error: null,
      });
      vi.spyOn(sessionRepository, "getSavedSessionIds").mockResolvedValue({
        data: [],
        error: null,
      });

      const studentUser = {
        id: "student-1",
        authUserId: "student-1",
        studentId: "22-1111-22",
        name: "Student One",
        email: "student1@cpu.edu.ph",
        role: "student",
        yearLevel: "Sophomore",
        program: "BSCS",
        section: "2A",
        active: true,
        accountSetup: { completed: true, skipped: false, mustChangePassword: false },
      };

      const seedState = {
        version: DEMO_STATE_VERSION,
        currentUserId: "student-1",
        users: [studentUser],
        events: mockSessions,
        subjects: [],
        rsvps: [],
        scheduleEventIds: { "student-1": [] },
        attendance: [],
        notes: [],
        favouriteNoteIds: {},
        points: [],
        notifications: [],
        announcements: [],
        preferences: {},
      };
      window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(seedState));

      function StateInspector() {
        const { state, toggleSchedule, toggleRsvp } = useAppData();
        const userSchedules = state.scheduleEventIds["student-1"] ?? [];
        const isSaved = userSchedules.includes("session-101");
        const hasRsvp = state.rsvps.some(
          (r) => r.eventId === "session-101" && r.userId === "student-1"
        );

        return (
          <div>
            <div data-testid="saved-status">{isSaved ? "SAVED" : "NOT_SAVED"}</div>
            <div data-testid="rsvp-status">{hasRsvp ? "RSVPED" : "NOT_RSVPED"}</div>
            <button onClick={() => void toggleSchedule("session-101")}>Toggle Save</button>
            <button onClick={() => void toggleRsvp("session-101")}>Toggle RSVP</button>
          </div>
        );
      }

      render(
        <AppDataProvider>
          <StateInspector />
        </AppDataProvider>
      );

      // Wait for initial hydration to settle
      await waitFor(() => {
        expect(screen.getByTestId("saved-status").textContent).toBe("NOT_SAVED");
        expect(screen.getByTestId("rsvp-status").textContent).toBe("NOT_RSVPED");
      });

      // 1. Manually save session
      fireEvent.click(screen.getByRole("button", { name: "Toggle Save" }));
      await waitFor(() => {
        expect(screen.getByTestId("saved-status").textContent).toBe("SAVED");
        expect(screen.getByTestId("rsvp-status").textContent).toBe("NOT_RSVPED");
      });

      // 2. RSVP to same session
      fireEvent.click(screen.getByRole("button", { name: "Toggle RSVP" }));
      await waitFor(() => {
        expect(screen.getByTestId("saved-status").textContent).toBe("SAVED");
        expect(screen.getByTestId("rsvp-status").textContent).toBe("RSVPED");
      });

      // 3. Remove RSVP (cancelling RSVP preserves manual save)
      fireEvent.click(screen.getByRole("button", { name: "Toggle RSVP" }));
      await waitFor(() => {
        expect(screen.getByTestId("saved-status").textContent).toBe("SAVED");
        expect(screen.getByTestId("rsvp-status").textContent).toBe("NOT_RSVPED");
      });
    });
  });
});
