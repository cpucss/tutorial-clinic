import { useMemo, useState } from "react";
import { Bell, CalendarCheck, CheckCheck, FileCheck2, Megaphone, Settings, Trophy, UserRound } from "lucide-react";

import { EmptyState, StatusBadge } from "../../../components/common/Feedback";
import type { TabKey } from "../../../components/layout/Sidebar";
import { useAppData } from "../../../context/AppDataContext";
import type { DemoNotification, NotificationType } from "../../../types/app";
import { relativeTime } from "../../../utils/format";

type Filter = "All" | "Unread" | "Events" | "Attendance" | "Notes" | "System";
const filters: Filter[] = ["All", "Unread", "Events", "Attendance", "Notes", "System"];

export function NotificationsPage({ onNavigate }: { onNavigate?: (tab: TabKey) => void }) {
  const { state, currentUser, markNotification, markAllNotifications } = useAppData();
  const [filter, setFilter] = useState<Filter>("All");
  const mine = useMemo(() => {
    const items = state.notifications.filter((item) => item.userId === currentUser?.id || item.userId === currentUser?.authUserId);
    if (currentUser?.accountSetup.mustChangePassword && currentUser.accountSetup.skipped) {
      items.push({
        id: `account-password-reminder:${currentUser.id}`,
        userId: currentUser.id,
        title: "Change your temporary password",
        message: "Finish securing your account from Settings. This reminder will close automatically after your password is changed.",
        type: "Account",
        createdAt: currentUser.accountSetup.promptDismissedAt || new Date().toISOString(),
        relatedTab: "settings",
      });
    }
    return items.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }, [currentUser, state.notifications]);
  const unread = mine.filter((item) => !item.readAt).length;
  const visible = mine.filter((item) => {
    if (filter === "All") return true;
    if (filter === "Unread") return !item.readAt;
    if (filter === "Events") return item.type === "Event" || item.type === "Announcement";
    if (filter === "System") return ["System", "Account", "Points"].includes(item.type);
    return item.type === filter;
  });

  function openRelated(item: DemoNotification) {
    if (!isPasswordReminder(item)) void markNotification(item.id, true);
    if (item.relatedTab) onNavigate?.(item.relatedTab as TabKey);
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div><div className="section-kicker">Inbox</div><h1 className="page-heading">Notifications</h1><p className="page-description">Session reminders, attendance decisions, note reviews, points, and account updates.</p></div>
          <div className="flex flex-wrap gap-2">
            <button className="secondary-button" onClick={markAllNotifications} disabled={!unread}><CheckCheck size={15} /> Mark all read</button>
          </div>
        </header>

        <div className="mt-6 flex flex-col gap-4 rounded-xl bg-white p-4 demo-card sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2"><Bell size={18} color="#F5A623" /><strong>{unread} unread</strong><span className="text-sm text-[#6F6F6F]">of {mine.length} notifications</span></div>
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Notification filters">
            {filters.map((item) => <button key={item} role="tab" aria-selected={filter === item} className={`filter-chip ${filter === item ? "is-active" : ""}`} onClick={() => setFilter(item)}>{item}</button>)}
          </div>
        </div>

        {visible.length ? <ul className="mt-4 grid gap-2">{visible.map((item) => <li key={item.id} className={`notification-row ${item.readAt ? "is-read" : "is-unread"}`}>
          <button className="notification-main" onClick={() => openRelated(item)}>
            <span className="notification-type-icon">{typeIcon(item.type)}</span>
            <span className="min-w-0 flex-1 text-left"><span className="flex flex-wrap items-center gap-2"><strong>{item.title}</strong>{isPasswordReminder(item) ? <StatusBadge status="Action required" /> : !item.readAt && <StatusBadge status="Unread" />}</span><span className="mt-1 block text-sm text-[#6F6F6F]">{item.message}</span><span className="mt-2 block text-xs text-[#8A8377]">{item.type} - {relativeTime(item.createdAt)}</span></span>
          </button>
          <div className="notification-actions">{isPasswordReminder(item) ? <button onClick={() => onNavigate?.("settings")}>Change now</button> : item.readAt ? <button onClick={() => markNotification(item.id, false)}>Mark unread</button> : <button onClick={() => markNotification(item.id, true)}>Mark read</button>}</div>
        </li>)}</ul> : <div className="mt-5"><EmptyState icon={<Bell size={18} />} title={filter === "All" ? "No notifications" : "Nothing in this filter"} body={filter === "All" ? "New Tutorial Clinic updates will appear here." : "Try another filter or return later for new updates."} /></div>}
      </div>
    </div>
  );
}

function isPasswordReminder(item: DemoNotification) {
  return item.id.startsWith("account-password-reminder:");
}

function typeIcon(type: NotificationType) {
  if (type === "Event" || type === "Attendance") return <CalendarCheck size={17} />;
  if (type === "Notes") return <FileCheck2 size={17} />;
  if (type === "Points") return <Trophy size={17} />;
  if (type === "Announcement") return <Megaphone size={17} />;
  if (type === "Account") return <UserRound size={17} />;
  return <Settings size={17} />;
}
