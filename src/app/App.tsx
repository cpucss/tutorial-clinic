import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

import { Sidebar, TabKey } from "../components/layout/Sidebar";
import { TopBar } from "../components/layout/TopBar";
import { ConfirmDialog, SkeletonBlock, ToastViewport } from "../components/common/Feedback";
import type { ToastMessage } from "../components/common/Feedback";
import { QrModal } from "../features/attendance/components/QrModal";

import { EventsPage } from "../features/attendance/pages/EventsPage";
import { LeaderboardPage } from "../features/leaderboard/pages/LeaderboardPage";
import { NotesPage } from "../features/notes/pages/NotesPage";
import { LoginPage } from "../features/auth/pages/LoginPage";
import { ProfilePage } from "../features/auth/pages/ProfilePage";
import { PointsPage } from "../features/points/pages/PointsPage";
import { NotificationsPage } from "../features/notifications/pages/NotificationsPage";
import { MyNotesPage } from "../features/notes/pages/MyNotesPage";
import { FavouritesPage } from "../features/notes/pages/FavouritesPage";
import { DashboardPage } from "../features/dashboard/pages/DashboardPage";
import { AttendanceCheckinPage } from "../features/attendance/pages/AttendanceCheckinPage";
import { AdminDashboardPage } from "../features/admin/pages/AdminDashboardPage";
import { AdminAttendancePage } from "../features/admin/pages/AdminAttendancePage";
import { AdminSessionsPage } from "../features/admin/pages/AdminSessionsPage";
import { AdminNotesApprovalPage } from "../features/admin/pages/AdminNotesApprovalPage";
import { AdminStudentsPage } from "../features/admin/pages/AdminStudentsPage";
import { AdminSubjectsPage } from "../features/admin/pages/AdminSubjectsPage";
import { currentUser as seedUser, events } from "../mock";
import type { User } from "../types/user";

type YearLevel = "Freshman" | "Sophomore" | "Junior" | "Senior";

const TITLES: Record<TabKey, string> = {
  dashboard: "Workspace / Dashboard",
  events: "Workspace / Events",
  "attendance-history": "Workspace / Attendance",
  leaderboard: "Workspace / Leaderboard",
  notes: "Workspace / Notes Library",
  profile: "Workspace / My Profile",
  points: "Guides / Points Guideline",
  notifications: "Inbox / Notifications",
  favourites: "Personal / Favourites",
  "my-notes": "Personal / My Notes",
  "admin-dashboard": "Admin / Dashboard",
  "admin-attendance": "Admin / Attendance",
  "admin-sessions": "Admin / Sessions",
  "admin-notes": "Admin / Notes Approval",
  "admin-students": "Admin / Students",
  "admin-subjects": "Admin / Subjects",
};

const TABS_WITH_YEAR_FILTER: TabKey[] = ["events", "leaderboard"];
const ADMIN_TABS: TabKey[] = [
  "admin-dashboard",
  "admin-attendance",
  "admin-sessions",
  "admin-notes",
  "admin-students",
  "admin-subjects",
];

export default function App() {
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User>(seedUser);
  const [tab, setTab] = useState<TabKey>("dashboard");
  const [rsvped, setRsvped] = useState<Set<string>>(new Set(["evt-1"]));
  const [attended] = useState<Set<string>>(new Set());
  const [qrEventId, setQrEventId] = useState<string | null>(null);
  const [yearFilter, setYearFilter] = useState<"All" | YearLevel>("All");
  const [notesBreadcrumb, setNotesBreadcrumb] = useState("All notes");
  const [myNotesBreadcrumb, setMyNotesBreadcrumb] = useState("New note");
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [cancelRsvpId, setCancelRsvpId] = useState<string | null>(null);
  const [loadingTab, setLoadingTab] = useState<TabKey | null>("dashboard");

  const TITLES_MAP = TITLES;

  const title =
    tab === "notes"
      ? `Workspace / Notes Library / ${notesBreadcrumb}`
      : tab === "my-notes"
      ? `Personal / My Notes / ${myNotesBreadcrumb}`
      : TABS_WITH_YEAR_FILTER.includes(tab)
      ? `${TITLES_MAP[tab]} / ${yearFilter}`
      : TITLES_MAP[tab];

  useEffect(() => {
    if (user.role !== "admin" && ADMIN_TABS.includes(tab)) {
      setTab("dashboard");
    }
  }, [tab, user.role]);

  useEffect(() => {
    setLoadingTab(tab);
    const id = window.setTimeout(() => setLoadingTab(null), 180);
    return () => window.clearTimeout(id);
  }, [tab]);

  function notify(toast: Omit<ToastMessage, "id">) {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((items) => [...items, { id, ...toast }]);
    window.setTimeout(() => {
      setToasts((items) => items.filter((item) => item.id !== id));
    }, 4200);
  }

  function dismissToast(id: string) {
    setToasts((items) => items.filter((item) => item.id !== id));
  }

  function handleLogin(nextUser: User) {
    setUser(nextUser);
    setIsAuthenticated(true);
    setTab(nextUser.role === "admin" ? "admin-dashboard" : "dashboard");
    notify({
      tone: "success",
      title: `Signed in as ${nextUser.name}`,
      description: nextUser.role === "admin" ? "Admin tools are available." : "Your student workspace is ready.",
    });
  }

  function handleLogout() {
    setIsAuthenticated(false);
    setAuthMode("login");
    setTab("dashboard");
    notify({ tone: "info", title: "Signed out", description: "The app shell is protected again." });
  }

  function handleNavigate(nextTab: TabKey) {
    if (ADMIN_TABS.includes(nextTab) && user.role !== "admin") {
      notify({ tone: "error", title: "Admin access required", description: "Sign in with an admin account to open that page." });
      return;
    }
    setTab(nextTab);
  }

  function toggleRsvp(id: string) {
    if (rsvped.has(id)) {
      setCancelRsvpId(id);
      return;
    }

    setRsvped((s) => {
      const n = new Set(s);
      n.add(id);
      return n;
    });

    const event = events.find((item) => item.id === id);
    notify({
      tone: "success",
      title: "RSVP saved",
      description: event ? `${event.title} is now in your profile.` : "The session is now in your profile.",
    });
  }

  function confirmCancelRsvp() {
    if (!cancelRsvpId) return;
    const event = events.find((item) => item.id === cancelRsvpId);
    setRsvped((s) => {
      const n = new Set(s);
      n.delete(cancelRsvpId);
      return n;
    });
    notify({
      tone: "warning",
      title: "RSVP cancelled",
      description: event ? `${event.title} was removed from your profile.` : "The session was removed from your profile.",
    });
    setCancelRsvpId(null);
  }

  if (!isAuthenticated) {
    return (
      <>
        <LoginPage mode={authMode} onModeChange={setAuthMode} onLogin={handleLogin} />
        <ToastViewport toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  return (
    <div className="app-shell w-full min-h-dvh flex" style={{ background: "#fff" }}>
      <a href="#main-content" className="skip-link">Skip to content</a>
      <Sidebar active={tab} onChange={handleNavigate} role={user.role} />

      <div className="min-w-0 flex-1 flex flex-col" style={{ background: "#fff" }}>
        <TopBar
          title={title}
          user={user}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
          onShare={() =>
            notify({
              tone: "info",
              title: "Share link copied",
              description: "This is a front-end demo, so the link stays local for now.",
            })
          }
        />

        <main id="main-content" className="app-content min-w-0 flex-1 overflow-auto" style={{ background: "#FAF8F2" }}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={tab}
              className="motion-page h-full"
              initial={{ opacity: 0, y: 14, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -8, filter: "blur(6px)" }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              {loadingTab === tab ? (
                <PageSkeleton />
              ) : (
                <>
                  {tab === "dashboard" && (
                    <DashboardPage onNavigate={handleNavigate} />
                  )}

                  {tab === "events" && (
                    <EventsPage
                      rsvped={rsvped}
                      onToggleRsvp={toggleRsvp}
                      onShowQr={setQrEventId}
                      year={yearFilter}
                      onYearChange={setYearFilter}
                    />
                  )}

                  {tab === "leaderboard" && (
                    <LeaderboardPage filter={yearFilter} onFilterChange={setYearFilter} />
                  )}

                  {tab === "notes" && (
                    <NotesPage onBreadcrumbChange={setNotesBreadcrumb} onNotify={notify} />
                  )}

                  {tab === "profile" && (
                    <ProfilePage
                      rsvped={rsvped}
                      attended={attended}
                      onShowQr={setQrEventId}
                      onCancelRsvp={toggleRsvp}
                    />
                  )}

                  {tab === "points" && <PointsPage />}
                  {tab === "attendance-history" && <AttendanceCheckinPage onNotify={notify} />}
                  {tab === "notifications" && <NotificationsPage />}
                  {tab === "favourites" && <FavouritesPage />}
                  {tab === "admin-dashboard" && <AdminDashboardPage onNavigate={handleNavigate} />}
                  {tab === "admin-attendance" && <AdminAttendancePage />}
                  {tab === "admin-sessions" && <AdminSessionsPage onNotify={notify} />}
                  {tab === "admin-notes" && <AdminNotesApprovalPage onNotify={notify} />}
                  {tab === "admin-students" && <AdminStudentsPage onNotify={notify} />}
                  {tab === "admin-subjects" && <AdminSubjectsPage />}

                  {tab === "my-notes" && (
                    <MyNotesPage onBreadcrumbChange={setMyNotesBreadcrumb} onNotify={notify} />
                  )}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {qrEventId && (
        <QrModal eventId={qrEventId} onClose={() => setQrEventId(null)} />
      )}

      <ConfirmDialog
        open={Boolean(cancelRsvpId)}
        title="Cancel this RSVP?"
        body="Your saved QR code for this session will stop showing in your profile. You can RSVP again later if seats are still available."
        confirmLabel="Cancel RSVP"
        cancelLabel="Keep RSVP"
        tone="warning"
        onCancel={() => setCancelRsvpId(null)}
        onConfirm={confirmCancelRsvp}
      />

      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-10">
      <div className="grid gap-5 lg:grid-cols-[310px_1fr]">
        <SkeletonBlock lines={5} />
        <div className="grid gap-4">
          <SkeletonBlock lines={4} />
          <div className="grid gap-3 md:grid-cols-3">
            <SkeletonBlock lines={3} />
            <SkeletonBlock lines={3} />
            <SkeletonBlock lines={3} />
          </div>
          <SkeletonBlock lines={6} />
        </div>
      </div>
    </div>
  );
}
