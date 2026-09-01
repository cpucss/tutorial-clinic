import { render, screen, act, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { InactivityManager, INACTIVITY_TIMEOUT_MS, WARNING_THRESHOLD_MS } from "../components/auth/InactivityManager";
import * as AppDataContextModule from "../context/AppDataContext";

import type { ToastMessage } from "../components/common/Feedback";

describe("InactivityManager Unit Tests", () => {
  let mockLogout: () => void;
  let mockNotify: (toast: Omit<ToastMessage, "id">) => void;
  let mockNavigate: () => void;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-02T10:00:00Z"));
    mockLogout = vi.fn();
    mockNotify = vi.fn();
    mockNavigate = vi.fn();

    vi.spyOn(AppDataContextModule, "useAppData").mockReturnValue({
      currentUser: {
        id: "test-student-id",
        studentId: "24-0673-83",
        name: "Test Student",
        email: "24-0673-83@cpucss.edu.ph",
        role: "student",
        yearLevel: "Freshman",
        avatarUrl: null,
        active: true,
        points: 100,
        streakDays: 3,
        createdAt: "2026-09-01T00:00:00Z",
        updatedAt: "2026-09-01T00:00:00Z",
        accountSetup: { completed: true },
      },
      logout: mockLogout,
    } as unknown as ReturnType<typeof AppDataContextModule.useAppData>);
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("does not show warning when under 4 minutes of inactivity", () => {
    render(<InactivityManager onNotify={mockNotify} onNavigateToLogin={mockNavigate} />);

    act(() => {
      vi.advanceTimersByTime(WARNING_THRESHOLD_MS - 5000); // 3m 55s
    });

    expect(screen.queryByText("Session timeout warning")).toBeNull();
    expect(mockLogout).not.toHaveBeenCalled();
  });

  it("shows warning dialog at 4 minutes of inactivity with countdown", () => {
    render(<InactivityManager onNotify={mockNotify} onNavigateToLogin={mockNavigate} />);

    act(() => {
      vi.advanceTimersByTime(WARNING_THRESHOLD_MS + 1000); // 4m 1s
    });

    expect(screen.getByText("Session timeout warning")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Stay signed in" })).toBeInTheDocument();
    expect(mockLogout).not.toHaveBeenCalled();
  });

  it("resets inactivity timer and dismisses warning on 'Stay signed in' click", () => {
    render(<InactivityManager onNotify={mockNotify} onNavigateToLogin={mockNavigate} />);

    act(() => {
      vi.advanceTimersByTime(WARNING_THRESHOLD_MS + 2000); // 4m 2s
    });

    expect(screen.getByText("Session timeout warning")).toBeInTheDocument();

    const stayBtn = screen.getByRole("button", { name: "Stay signed in" });
    act(() => {
      fireEvent.click(stayBtn);
    });

    expect(screen.queryByText("Session timeout warning")).toBeNull();

    // Advance 3 minutes further (total 7m elapsed, but reset 3m ago)
    act(() => {
      vi.advanceTimersByTime(3 * 60 * 1000);
    });

    // Still under 4m since reset, so no warning and no logout
    expect(screen.queryByText("Session timeout warning")).toBeNull();
    expect(mockLogout).not.toHaveBeenCalled();
  });

  it("automatically signs out after 5 minutes of total inactivity", () => {
    render(<InactivityManager onNotify={mockNotify} onNavigateToLogin={mockNavigate} />);

    act(() => {
      vi.advanceTimersByTime(INACTIVITY_TIMEOUT_MS + 1000); // 5m 1s
    });

    expect(mockLogout).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNotify).toHaveBeenCalledWith(
      expect.objectContaining({
        tone: "warning",
        title: "Session timed out",
        description: "You were signed out after 5 minutes of inactivity. Please sign in again.",
      })
    );
  });

  it("immediately triggers sign out if elapsed time exceeds 5 minutes when tab becomes visible", () => {
    render(<InactivityManager onNotify={mockNotify} onNavigateToLogin={mockNavigate} />);

    // Simulate returning after 6 minutes in background
    act(() => {
      vi.advanceTimersByTime(6 * 60 * 1000);
      Object.defineProperty(document, "visibilityState", { value: "visible", writable: true });
      document.dispatchEvent(new Event("visibilitychange"));
    });

    expect(mockLogout).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledTimes(1);
  });
});
