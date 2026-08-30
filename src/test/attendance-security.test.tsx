import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AppDataProvider } from "../context/AppDataContext";
import { createSeedState, DEMO_STORAGE_KEY } from "../data/seed";
import { AdminStudentQrScanner, StudentAttendanceQr } from "../features/attendance/components/StudentAttendanceQr";
import { isValidOpaqueQrToken } from "../features/attendance/qr";
import { DashboardPage } from "../features/dashboard/pages/DashboardPage";
import * as attendanceRepo from "../services/supabase/attendanceRepository";

describe("Attendance Frontend & QR Security Tests", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    window.localStorage.clear();
  });

  describe("Student Attendance QR Generator", () => {
    it("renders server-issued QR code with countdown on successful RPC", async () => {
      const mockToken = "a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890";
      const futureExpiry = new Date(Date.now() + 5 * 60 * 1000).toISOString();

      vi.spyOn(attendanceRepo, "issueAttendanceQr").mockResolvedValue({
        token: mockToken,
        expiresAt: futureExpiry,
        error: null,
      });

      const seed = createSeedState();
      seed.currentUserId = "stu-042";
      window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(seed));

      render(
        <AppDataProvider>
          <StudentAttendanceQr />
        </AppDataProvider>
      );

      await waitFor(() => {
        expect(screen.getByTitle("Attendance QR")).toBeInTheDocument();
      });

      expect(screen.getByText(/remaining/i)).toBeInTheDocument();
      expect(screen.getByText(/Show this QR to an administrator/i)).toBeInTheDocument();
      expect(screen.queryByText(/Internet Connection Required/i)).not.toBeInTheDocument();
    });

    it("displays error and no QR when server RPC fails (no fake fallback token)", async () => {
      vi.spyOn(attendanceRepo, "issueAttendanceQr").mockResolvedValue({
        token: null,
        expiresAt: null,
        error: "Database function issue_attendance_qr rate limit exceeded",
      });

      const seed = createSeedState();
      seed.currentUserId = "stu-042";
      window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(seed));

      render(
        <AppDataProvider>
          <StudentAttendanceQr />
        </AppDataProvider>
      );

      await waitFor(() => {
        expect(screen.getByText("Unable to Generate QR")).toBeInTheDocument();
      });

      // Crucial security invariant: no QR SVG is rendered
      expect(screen.queryByTitle("Attendance QR")).not.toBeInTheDocument();
      expect(screen.getByText(/rate limit exceeded/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Retry/i })).toBeInTheDocument();
    });

    it("displays offline warning and no QR when device is offline", async () => {
      vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
      const rpcSpy = vi.spyOn(attendanceRepo, "issueAttendanceQr");

      const seed = createSeedState();
      seed.currentUserId = "stu-042";
      window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(seed));

      render(
        <AppDataProvider>
          <StudentAttendanceQr />
        </AppDataProvider>
      );

      await waitFor(() => {
        expect(screen.getByText("Internet Connection Required")).toBeInTheDocument();
      });

      expect(screen.queryByTitle("Attendance QR")).not.toBeInTheDocument();
      // RPC should not even be called when navigator.onLine is false
      expect(rpcSpy).not.toHaveBeenCalled();
    });

    it("hides expired QR code and provides refresh action", async () => {
      const mockToken = "a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890";
      // Expiry 1 second in the past
      const pastExpiry = new Date(Date.now() - 1000).toISOString();

      vi.spyOn(attendanceRepo, "issueAttendanceQr").mockResolvedValue({
        token: mockToken,
        expiresAt: pastExpiry,
        error: null,
      });

      const seed = createSeedState();
      seed.currentUserId = "stu-042";
      window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(seed));

      render(
        <AppDataProvider>
          <StudentAttendanceQr />
        </AppDataProvider>
      );

      await waitFor(() => {
        expect(screen.getByText("This attendance QR has expired.")).toBeInTheDocument();
      });

      expect(screen.queryByTitle("Attendance QR")).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Generate new QR/i })).toBeInTheDocument();
    });

    it("allows manual refresh which requests a fresh server token", async () => {
      const firstToken = "1111111111111111111111111111111111111111111111111111111111111111";
      const secondToken = "2222222222222222222222222222222222222222222222222222222222222222";
      const futureExpiry = new Date(Date.now() + 5 * 60 * 1000).toISOString();

      const rpcSpy = vi.spyOn(attendanceRepo, "issueAttendanceQr")
        .mockResolvedValueOnce({ token: firstToken, expiresAt: futureExpiry, error: null })
        .mockResolvedValueOnce({ token: secondToken, expiresAt: futureExpiry, error: null });

      const notifyMock = vi.fn();
      const seed = createSeedState();
      seed.currentUserId = "stu-042";
      window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(seed));

      render(
        <AppDataProvider>
          <StudentAttendanceQr onNotify={notifyMock} />
        </AppDataProvider>
      );

      await waitFor(() => {
        expect(screen.getByTitle("Attendance QR")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button", { name: /Generate new QR/i }));

      await waitFor(() => {
        expect(rpcSpy).toHaveBeenCalledTimes(2);
      });

      expect(notifyMock).toHaveBeenCalledWith(expect.objectContaining({
        title: "New QR generated",
        description: expect.stringContaining("invalidated"),
      }));
    });

    it("does not render for administrator role", () => {
      const seed = createSeedState();
      seed.currentUserId = "adm-001";
      window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(seed));

      const { container } = render(
        <AppDataProvider>
          <StudentAttendanceQr />
        </AppDataProvider>
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe("Admin Student QR Scanner", () => {
    it("renders session selector and start scanner button for admin", () => {
      const seed = createSeedState();
      seed.currentUserId = "adm-001";
      window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(seed));

      render(
        <AppDataProvider>
          <AdminStudentQrScanner />
        </AppDataProvider>
      );

      expect(screen.getByLabelText("Session")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Start scanner/i })).toBeInTheDocument();
      expect(screen.getByText("Scanner ready")).toBeInTheDocument();
    });

    it("validates opaque single-use token and displays verified student identity only after server success", async () => {
      const mockToken = "a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890";
      const seed = createSeedState();
      seed.currentUserId = "adm-001";
      window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(seed));

      render(
        <AppDataProvider>
          <AdminStudentQrScanner />
        </AppDataProvider>
      );

      expect(isValidOpaqueQrToken(mockToken)).toBe(true);
      expect(isValidOpaqueQrToken("invalid-short")).toBe(false);
      expect(isValidOpaqueQrToken("http://malicious.link/phish")).toBe(false);
    });
  });

  describe("Student Dashboard Discoverability", () => {
    it("displays prominent 'Generate My QR' action for students", () => {
      const seed = createSeedState();
      seed.currentUserId = "stu-042";
      window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(seed));

      const handleOpenQr = vi.fn();

      render(
        <AppDataProvider>
          <DashboardPage onOpenQr={handleOpenQr} />
        </AppDataProvider>
      );

      const qrButtons = screen.getAllByRole("button", { name: "Generate My QR" });
      expect(qrButtons.length).toBeGreaterThanOrEqual(1);

      fireEvent.click(qrButtons[0]);
      expect(handleOpenQr).toHaveBeenCalledTimes(1);
    });

    it("does not display student QR generation card for administrators", () => {
      const seed = createSeedState();
      seed.currentUserId = "adm-001";
      window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(seed));

      render(
        <AppDataProvider>
          <DashboardPage />
        </AppDataProvider>
      );

      expect(screen.queryByRole("button", { name: "Generate My QR" })).not.toBeInTheDocument();
      expect(screen.queryByText("Generate My QR")).not.toBeInTheDocument();
    });
  });
});
