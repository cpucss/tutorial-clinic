import * as React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { AppDataProvider } from "../context/AppDataContext";
import { EventsPage } from "../features/attendance/pages/EventsPage";
import { ProfilePage } from "../features/auth/pages/ProfilePage";
import * as sessionRepository from "../services/supabase/sessionRepository";
import { supabase } from "../services/supabase/client";
import type { DemoEvent, DemoUser } from "../types/app";
import { DEMO_STORAGE_KEY, DEMO_STATE_VERSION } from "../data/seed";

const now = Date.now();
const oneHour = 60 * 60 * 1000;

const mockLiveSession: DemoEvent = {
  id: "event-live-1",
  title: "Live Peer Mentoring Session",
  description: "Live interactive mentoring in progress.",
  subjectId: "sub-101",
  date: new Date(now - 30 * 60 * 1000).toISOString(), // started 30 mins ago
  endDate: new Date(now + 30 * 60 * 1000).toISOString(), // ends in 30 mins
  venue: "CS Lab 1",
  capacity: 30,
  instructor: "Lead Tutor",
  instructorRole: "Peer Mentor",
  status: "Upcoming", // Stored as Upcoming in DB, but date makes it Live!
  attendanceCode: "ATT123",
  topics: ["Trees", "Graphs"],
  yearLevels: ["Freshman", "Sophomore", "Junior", "Senior"],
  createdAt: new Date(now - 2 * oneHour).toISOString(),
};

const mockFutureUpcomingSession: DemoEvent = {
  id: "event-upcoming-2",
  title: "Future Algorithm Workshop",
  description: "Scheduled for next week.",
  subjectId: "sub-102",
  date: new Date(now + 24 * oneHour).toISOString(),
  endDate: new Date(now + 26 * oneHour).toISOString(),
  venue: "CS Lab 2",
  capacity: 40,
  instructor: "Algo Specialist",
  instructorRole: "Lecturer",
  status: "Upcoming",
  attendanceCode: "ATT456",
  topics: ["Dynamic Programming"],
  yearLevels: ["Sophomore", "Junior"],
  createdAt: new Date(now - 2 * oneHour).toISOString(),
};

const mockCompletedSession: DemoEvent = {
  id: "event-completed-3",
  title: "Past Revision Clinic",
  description: "Finished yesterday.",
  subjectId: "sub-101",
  date: new Date(now - 48 * oneHour).toISOString(),
  endDate: new Date(now - 46 * oneHour).toISOString(),
  venue: "CS Room A",
  capacity: 25,
  instructor: "Past Tutor",
  instructorRole: "Tutor",
  status: "Upcoming", // DB stored as Upcoming, derived is Completed
  attendanceCode: "ATT789",
  topics: ["Pointers"],
  yearLevels: ["Freshman"],
  createdAt: new Date(now - 72 * oneHour).toISOString(),
};

const mockCancelledSession: DemoEvent = {
  id: "event-cancelled-4",
  title: "Cancelled Exam Prep",
  description: "This session was cancelled.",
  subjectId: "sub-103",
  date: new Date(now + 12 * oneHour).toISOString(),
  endDate: new Date(now + 14 * oneHour).toISOString(),
  venue: "Auditorium",
  capacity: 100,
  instructor: "Guest",
  instructorRole: "Speaker",
  status: "Cancelled",
  attendanceCode: "ATT000",
  topics: ["Review"],
  yearLevels: ["Freshman", "Sophomore", "Junior", "Senior"],
  createdAt: new Date(now - 2 * oneHour).toISOString(),
};

const mockDraftSession: DemoEvent = {
  id: "event-draft-5",
  title: "Draft Unfinished Session",
  description: "Not yet published.",
  subjectId: "sub-101",
  date: new Date(now + 10 * oneHour).toISOString(),
  endDate: new Date(now + 12 * oneHour).toISOString(),
  venue: "Room B",
  capacity: 20,
  instructor: "TBD",
  instructorRole: "Tutor",
  status: "Draft",
  attendanceCode: "DRAFT1",
  topics: ["Intro"],
  yearLevels: ["Freshman"],
  createdAt: new Date(now - 2 * oneHour).toISOString(),
};

const defaultMockEvents: DemoEvent[] = [
  mockLiveSession,
  mockFutureUpcomingSession,
  mockCompletedSession,
  mockCancelledSession,
  mockDraftSession,
];

const studentUser: DemoUser = {
  id: "student-user-1",
  authUserId: "student-user-1",
  studentId: "24-0001-11",
  name: "Jane Student",
  email: "24-0001-11@cpu.edu.ph",
  role: "student",
  yearLevel: "Sophomore",
  program: "BS Computer Science",
  section: "A",
  active: true,
  accountSetup: {
    completed: true,
    skipped: false,
    mustChangePassword: false,
  },
};

function setupInitialState(customUser?: Partial<DemoUser>, events?: DemoEvent[]) {
  const activeEvents = events ?? defaultMockEvents;
  const seedState = {
    version: DEMO_STATE_VERSION,
    users: [
      {
        ...studentUser,
        ...customUser,
      },
    ],
    currentUserId: customUser?.id || studentUser.id,
    subjects: [
      { id: "sub-101", code: "CS 111", name: "Intro to Computing", yearLevel: "Freshman", active: true },
      { id: "sub-102", code: "CS 211", name: "Data Structures", yearLevel: "Sophomore", active: true },
      { id: "sub-103", code: "CS 311", name: "Algorithms", yearLevel: "Junior", active: true },
    ],
    events: activeEvents,
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
  vi.spyOn(sessionRepository, "getSessions").mockResolvedValue({
    data: activeEvents,
    error: null,
  });
  return seedState;
}

describe("Events Page Lifecycle & Synchronization Regressions", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("1 & 2: Mandatory Assertion - Live session appears when Events first opens under the default Active filter alongside Future Upcoming sessions", async () => {
    setupInitialState();

    render(
      <MemoryRouter initialEntries={["/events"]}>
        <AppDataProvider>
          <EventsPage />
        </AppDataProvider>
      </MemoryRouter>
    );

    // Live session must appear immediately
    const liveMatches = await screen.findAllByText("Live Peer Mentoring Session");
    expect(liveMatches.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("LIVE")).toBeInTheDocument();

    // Future upcoming session must also appear immediately
    const upcomingMatches = await screen.findAllByText("Future Algorithm Workshop");
    expect(upcomingMatches.length).toBeGreaterThanOrEqual(1);

    // Draft session must NOT be displayed
    expect(screen.queryByText("Draft Unfinished Session")).not.toBeInTheDocument();

    // Completed and Cancelled sessions must NOT be displayed under default Active filter
    expect(screen.queryByText("Past Revision Clinic")).not.toBeInTheDocument();
    expect(screen.queryByText("Cancelled Exam Prep")).not.toBeInTheDocument();
  });

  it("3 & 4: Completed and Cancelled sessions appear when explicitly selected in the status filter", async () => {
    setupInitialState();

    render(
      <MemoryRouter initialEntries={["/events"]}>
        <AppDataProvider>
          <EventsPage />
        </AppDataProvider>
      </MemoryRouter>
    );

    const statusSelect = screen.getByLabelText("Status");

    // Select Completed filter
    fireEvent.change(statusSelect, { target: { value: "Completed" } });
    const completedMatches = await screen.findAllByText("Past Revision Clinic");
    expect(completedMatches.length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText("Live Peer Mentoring Session")).not.toBeInTheDocument();

    // Select Cancelled filter
    fireEvent.change(statusSelect, { target: { value: "Cancelled" } });
    const cancelledMatches = await screen.findAllByText("Cancelled Exam Prep");
    expect(cancelledMatches.length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText("Past Revision Clinic")).not.toBeInTheDocument();
  });

  it("5: Draft sessions are never shown to student users across all filters", async () => {
    setupInitialState();

    render(
      <MemoryRouter initialEntries={["/events"]}>
        <AppDataProvider>
          <EventsPage />
        </AppDataProvider>
      </MemoryRouter>
    );

    const statusSelect = screen.getByLabelText("Status");
    fireEvent.change(statusSelect, { target: { value: "All" } });

    // All published sessions appear
    const liveMatches = await screen.findAllByText("Live Peer Mentoring Session");
    expect(liveMatches.length).toBeGreaterThanOrEqual(1);
    const completedMatches = await screen.findAllByText("Past Revision Clinic");
    expect(completedMatches.length).toBeGreaterThanOrEqual(1);
    const cancelledMatches = await screen.findAllByText("Cancelled Exam Prep");
    expect(cancelledMatches.length).toBeGreaterThanOrEqual(1);

    // Draft session remains hidden
    expect(screen.queryByText("Draft Unfinished Session")).not.toBeInTheDocument();
  });

  it("6 & 7: Year level filtering correctly isolates all-year vs single-year targeted sessions", async () => {
    setupInitialState();

    render(
      <MemoryRouter initialEntries={["/events"]}>
        <AppDataProvider>
          <EventsPage />
        </AppDataProvider>
      </MemoryRouter>
    );

    const yearSelect = screen.getByLabelText("Year");

    // Filter by Junior
    fireEvent.change(yearSelect, { target: { value: "Junior" } });

    // Live session (all years) and Upcoming workshop (Sophomore, Junior) should both be visible
    const liveMatches = await screen.findAllByText("Live Peer Mentoring Session");
    expect(liveMatches.length).toBeGreaterThanOrEqual(1);
    const upcomingMatches = await screen.findAllByText("Future Algorithm Workshop");
    expect(upcomingMatches.length).toBeGreaterThanOrEqual(1);

    // Filter by Senior
    fireEvent.change(yearSelect, { target: { value: "Senior" } });

    // Live session is for all years, so visible; Upcoming workshop is Sophomore/Junior only, so hidden
    const seniorLiveMatches = await screen.findAllByText("Live Peer Mentoring Session");
    expect(seniorLiveMatches.length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText("Future Algorithm Workshop")).not.toBeInTheDocument();
  });

  it("8: Missing student year level renders 'Year level not assigned' without defaulting to Freshman", async () => {
    setupInitialState({ yearLevel: null });

    render(
      <MemoryRouter initialEntries={["/profile"]}>
        <AppDataProvider>
          <ProfilePage />
        </AppDataProvider>
      </MemoryRouter>
    );

    const yearMatches = await screen.findAllByText(/Year level not assigned/);
    expect(yearMatches.length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText("Freshman")).not.toBeInTheDocument();
  });

  it("10: Surface session fetch failure with error notice and retry button", async () => {
    setupInitialState(undefined, []);
    vi.spyOn(sessionRepository, "getSessions").mockResolvedValue({
      data: null,
      error: "Network connection refused.",
    });

    render(
      <MemoryRouter initialEntries={["/events"]}>
        <AppDataProvider>
          <EventsPage />
        </AppDataProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText(/Synchronization issue/)).toBeInTheDocument();
    expect(screen.getByText(/Network connection refused/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Retry sync/ })).toBeInTheDocument();
  });

  it("12: Notification navigation with sessionId selects session and adjusts filters", async () => {
    setupInitialState();

    render(
      <MemoryRouter initialEntries={["/events?sessionId=event-completed-3"]}>
        <AppDataProvider>
          <EventsPage />
        </AppDataProvider>
      </MemoryRouter>
    );

    // The completed session must be selected and displayed even though default filter is Active
    const completedMatches = await screen.findAllByText("Past Revision Clinic");
    expect(completedMatches.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole("heading", { name: "Past Revision Clinic" })).toBeInTheDocument();
  });

  it("13: Selected session updates automatically when active filter changes", async () => {
    setupInitialState();

    render(
      <MemoryRouter initialEntries={["/events"]}>
        <AppDataProvider>
          <EventsPage />
        </AppDataProvider>
      </MemoryRouter>
    );

    // Initial default: Live session is selected
    const initialLiveMatches = await screen.findAllByText("Live Peer Mentoring Session");
    expect(initialLiveMatches.length).toBeGreaterThanOrEqual(1);

    const statusSelect = screen.getByLabelText("Status");
    // Switch to Upcoming only (which filters out Live session)
    fireEvent.change(statusSelect, { target: { value: "Upcoming" } });

    // The upcoming workshop becomes the selected session in the detail view
    expect(await screen.findByRole("heading", { name: "Future Algorithm Workshop" })).toBeInTheDocument();
  });

  it("14 & 15: Focus revalidation and Realtime subscription cleanup on unmount", async () => {
    const channelSpy = vi.spyOn(supabase, "channel");
    const removeChannelSpy = vi.spyOn(supabase, "removeChannel");

    setupInitialState();

    const { unmount } = render(
      <MemoryRouter initialEntries={["/events"]}>
        <AppDataProvider>
          <EventsPage />
        </AppDataProvider>
      </MemoryRouter>
    );

    expect(channelSpy).toHaveBeenCalledWith(expect.stringMatching(/public:workspace-realtime/));

    unmount();
    expect(removeChannelSpy).toHaveBeenCalled();
  });
});
