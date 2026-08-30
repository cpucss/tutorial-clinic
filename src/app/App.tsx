import { lazy, Suspense, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useLocation, useNavigate } from "react-router";

import { SkeletonBlock, ToastViewport } from "../components/common/Feedback";
import type { ToastMessage } from "../components/common/Feedback";
import { Sidebar } from "../components/layout/Sidebar";
import type { TabKey } from "../components/layout/Sidebar";
import { TopBar } from "../components/layout/TopBar";
import { useAppData } from "../context/AppDataContext";
import { AnnouncementsPage } from "../features/announcements/pages/AnnouncementsPage";
import { QrModeSheet } from "../features/attendance/components/QrModeSheet";
import { AttendanceHistoryPage } from "../features/attendance/pages/AttendanceHistoryPage";
import { EventsPage } from "../features/attendance/pages/EventsPage";
import { AccountSetupModal } from "../features/auth/components/AccountSetupModal";
import { LoginPage } from "../features/auth/pages/LoginPage";
import { ProfilePage } from "../features/auth/pages/ProfilePage";
import { SettingsPage } from "../features/auth/pages/SettingsPage";
import { DashboardPage } from "../features/dashboard/pages/DashboardPage";
import { HelpPage } from "../features/help/pages/HelpPage";
import { LeaderboardPage } from "../features/leaderboard/pages/LeaderboardPage";
import { FavouritesPage } from "../features/notes/pages/FavouritesPage";
import { NotificationsPage } from "../features/notifications/pages/NotificationsPage";
import { PointHistoryPage } from "../features/points/pages/PointHistoryPage";
import { PointsPage } from "../features/points/pages/PointsPage";
import { SchedulePage } from "../features/schedule/pages/SchedulePage";
import { TAB_PATHS, tabFromPath } from "./routes";

const NotesPage = lazy(() => import("../features/notes/pages/NotesPage").then((module) => ({ default: module.NotesPage })));
const MyNotesPage = lazy(() => import("../features/notes/pages/MyNotesPage").then((module) => ({ default: module.MyNotesPage })));
const AdminDashboardPage = lazy(() => import("../features/admin/pages/AdminDashboardPage").then((module) => ({ default: module.AdminDashboardPage })));
const AdminAttendancePage = lazy(() => import("../features/admin/pages/AdminAttendancePage").then((module) => ({ default: module.AdminAttendancePage })));
const AdminSessionsPage = lazy(() => import("../features/admin/pages/AdminSessionsPage").then((module) => ({ default: module.AdminSessionsPage })));
const AdminNotesApprovalPage = lazy(() => import("../features/admin/pages/AdminNotesApprovalPage").then((module) => ({ default: module.AdminNotesApprovalPage })));
const AdminStudentsPage = lazy(() => import("../features/admin/pages/AdminStudentsPage").then((module) => ({ default: module.AdminStudentsPage })));

const TITLES: Record<TabKey, string> = {
  dashboard: "Workspace / Dashboard", events: "Workspace / Events", schedule: "Workspace / My Schedule", "attendance-history": "Workspace / Attendance",
  leaderboard: "Workspace / Leaderboard", notes: "Workspace / Notes Library", profile: "Personal / Profile", points: "Guides / Points Guide",
  "points-history": "Personal / Point History", notifications: "Inbox / Notifications", announcements: "Community / Announcements", help: "Guides / Help",
  favourites: "Personal / Favourites", "my-notes": "Personal / My Notes", settings: "Account / Settings", "admin-dashboard": "Admin / Dashboard",
  "admin-attendance": "Admin / Attendance", "admin-sessions": "Admin / Sessions", "admin-notes": "Admin / Notes Approval", "admin-students": "Admin / Students",
};
const ADMIN_TABS: TabKey[] = ["admin-dashboard", "admin-attendance", "admin-sessions", "admin-notes", "admin-students"];

export default function App() {
  const location = useLocation(); const navigate = useNavigate(); const { currentUser, logout } = useAppData(); const [toasts, setToasts] = useState<ToastMessage[]>([]); const [qrModeOpen, setQrModeOpen] = useState(false); const [offline, setOffline] = useState(() => !navigator.onLine);
  const routeTab = tabFromPath(location.pathname); const fallback: TabKey = currentUser?.role === "admin" ? "admin-dashboard" : "dashboard"; const tab = routeTab ?? fallback; const title = TITLES[tab];
  useEffect(() => {
    if (!currentUser) { if (location.pathname !== "/login") navigate("/login", { replace: true }); return; }
    if (location.pathname === "/login" || !routeTab) { navigate(TAB_PATHS[fallback], { replace: true }); return; }
    if (currentUser.role !== "admin" && ADMIN_TABS.includes(routeTab)) navigate(TAB_PATHS.dashboard, { replace: true });
    if (currentUser.role === "admin" && !ADMIN_TABS.includes(routeTab) && !["profile", "settings", "notifications", "announcements", "help"].includes(routeTab)) navigate(TAB_PATHS["admin-dashboard"], { replace: true });
  }, [currentUser, fallback, location.pathname, navigate, routeTab]);
  useEffect(() => { document.title = `${title.split(" / ").at(-1)} - CCS Tutorial Clinic`; }, [title]);
  useEffect(() => { const update = () => setOffline(!navigator.onLine); window.addEventListener("online", update); window.addEventListener("offline", update); return () => { window.removeEventListener("online", update); window.removeEventListener("offline", update); }; }, []);
  useEffect(() => {
    const focusDialog = () => {
      const dialogs = Array.from(document.querySelectorAll<HTMLElement>('[role="dialog"][aria-modal="true"]'));
      const dialog = dialogs.at(-1); if (!dialog || dialog.dataset.focusReady) return;
      dialog.dataset.focusReady = "true";
      dialog.querySelector<HTMLElement>('input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])')?.focus();
    };
    const observer = new MutationObserver(focusDialog); observer.observe(document.body, { childList: true, subtree: true });
    const handleKey = (event: KeyboardEvent) => {
      const dialog = Array.from(document.querySelectorAll<HTMLElement>('[role="dialog"][aria-modal="true"]')).at(-1); if (!dialog) return;
      if (event.key === "Escape" && !dialog.classList.contains("confirm-dialog")) { const close = dialog.querySelector<HTMLButtonElement>('[aria-label*="Close"], header > button'); if (close) { event.preventDefault(); close.click(); } return; }
      if (event.key !== "Tab") return;
      const controls = Array.from(dialog.querySelectorAll<HTMLElement>('input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])'));
      const first = controls[0]; const last = controls.at(-1); if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", handleKey); focusDialog();
    return () => { observer.disconnect(); document.removeEventListener("keydown", handleKey); };
  }, []);

  function notify(toast: Omit<ToastMessage, "id">) { const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`; setToasts((items) => [...items, { ...toast, id }]); window.setTimeout(() => setToasts((items) => items.filter((item) => item.id !== id)), 4200); }
  function handleNavigate(next: TabKey) { if (ADMIN_TABS.includes(next) && currentUser?.role !== "admin") { notify({ tone: "error", title: "Admin access required", description: "Sign in with an administrator account to open this page." }); return; } navigate(TAB_PATHS[next]); }
  function handleLogout() { logout(); navigate("/login", { replace: true }); notify({ tone: "info", title: "Signed out", description: "Your session ended on this device." }); }
  async function share() { try { await navigator.clipboard.writeText(window.location.href); notify({ tone: "success", title: "Page link copied", description: "The hash route is ready to share." }); } catch { notify({ tone: "warning", title: "Clipboard unavailable", description: "Copy the current address from the browser bar." }); } }

  if (!currentUser) return <><LoginPage /><ToastViewport toasts={toasts} onDismiss={(id) => setToasts((items) => items.filter((item) => item.id !== id))} /></>;
  return <div className="app-shell flex min-h-dvh w-full"><a href="#main-content" className="skip-link">Skip to content</a><Sidebar active={tab} onChange={handleNavigate} onQrMode={() => setQrModeOpen(true)} role={currentUser.role} /><div className="flex min-h-0 min-w-0 flex-1 flex-col bg-white">{offline && <div className="offline-banner" role="status">You are offline - some backend features and camera access may be unavailable.</div>}<TopBar title={title} onNavigate={handleNavigate} onLogout={handleLogout} onShare={share} /><main id="main-content" className="app-content min-h-0 min-w-0 flex-1 overflow-auto bg-[#FAF8F2]"><AnimatePresence mode="wait" initial={false}><motion.div key={tab} className="motion-page h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.16 }}><Suspense fallback={<PageSkeleton />}><Page tab={tab} navigate={handleNavigate} notify={notify} onOpenQr={() => setQrModeOpen(true)} /></Suspense></motion.div></AnimatePresence></main></div>{qrModeOpen && <QrModeSheet onClose={() => setQrModeOpen(false)} onNotify={notify} />}{currentUser.role !== "admin" && !currentUser.accountSetup.completed && !currentUser.accountSetup.skipped && <AccountSetupModal onComplete={() => notify({ tone: "success", title: "Account setup complete", description: "Welcome to your personalized Tutorial Clinic dashboard." })} />}<ToastViewport toasts={toasts} onDismiss={(id) => setToasts((items) => items.filter((item) => item.id !== id))} /></div>;
}

function Page({ tab, navigate, notify, onOpenQr }: { tab: TabKey; navigate: (tab: TabKey) => void; notify: (toast: Omit<ToastMessage, "id">) => void; onOpenQr?: () => void }) {
  switch (tab) {
    case "dashboard": return <DashboardPage onNavigate={navigate} onOpenQr={onOpenQr} />; case "events": return <EventsPage onNotify={notify} />; case "schedule": return <SchedulePage onNavigate={navigate} />;
    case "attendance-history": return <AttendanceHistoryPage onNotify={notify} />; case "leaderboard": return <LeaderboardPage />; case "notes": return <NotesPage onNotify={notify} />;
    case "profile": return <ProfilePage onNavigate={navigate} />; case "points": return <PointsPage />; case "points-history": return <PointHistoryPage />; case "notifications": return <NotificationsPage onNavigate={navigate} />;
    case "announcements": return <AnnouncementsPage />; case "help": return <HelpPage />; case "favourites": return <FavouritesPage />; case "my-notes": return <MyNotesPage onNotify={notify} />; case "settings": return <SettingsPage onNotify={notify} />;
    case "admin-dashboard": return <AdminDashboardPage onNavigate={navigate} />; case "admin-attendance": return <AdminAttendancePage onNotify={notify} />; case "admin-sessions": return <AdminSessionsPage onNotify={notify} />;
    case "admin-notes": return <AdminNotesApprovalPage onNotify={notify} />; case "admin-students": return <AdminStudentsPage onNotify={notify} />;
  }
}
function PageSkeleton() { return <div className="p-6 lg:p-10"><div className="grid gap-4 lg:grid-cols-[300px_1fr]"><SkeletonBlock lines={5} /><SkeletonBlock lines={8} /></div></div>; }
