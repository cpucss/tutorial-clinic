import { useState } from "react";
import { Bell, CalendarCheck, FileCheck2, Trophy } from "lucide-react";
import { EmptyState, StatusBadge } from "../../../components/common/Feedback";

const items = [
  { id: "n1", icon: <CalendarCheck size={16} color="#1C1C1C" strokeWidth={1.75} />, title: "Reminder: Conquering Recursion", body: "Starts tomorrow at 3:00 PM in Room CS-204.", time: "2h ago", read: false },
  { id: "n2", icon: <FileCheck2 size={16} color="#1C1C1C" strokeWidth={1.75} />, title: "Your note was approved", body: "ER diagram practice set has been approved. +60 pts credited.", time: "1d ago", read: false },
  { id: "n3", icon: <Trophy size={16} color="#1C1C1C" strokeWidth={1.75} />, title: "You moved up the leaderboard", body: "You are now rank #5 in the Junior bracket.", time: "2d ago", read: true },
];

export function NotificationsPage() {
  const [notifications, setNotifications] = useState(items);
  const unreadCount = notifications.filter((item) => !item.read).length;

  function markAllRead() {
    setNotifications((current) => current.map((item) => ({ ...item, read: true })));
  }

  return (
    <div className="flex h-full flex-col bg-white lg:flex-row">
      <div className="w-full shrink-0 px-4 py-5 lg:w-[310px]" style={{ background: "#FFFFFF" }}>
        <h1 style={{ fontSize: 30, fontWeight: 700, color: "#1C1C1C", lineHeight: 1.2 }}>Inbox</h1>
        <p className="mt-2" style={{ fontSize: 13, color: "#6F6F6F", lineHeight: 1.55 }}>
          Session reminders, note approvals, and ranking updates.
        </p>
      </div>
      <div className="min-w-0 flex-1 bg-white overflow-y-auto">
        <div className="max-w-2xl px-4 py-6 sm:px-6 lg:px-10 lg:py-8 lg:pl-12">
          <h1 style={{ fontSize: 34, fontWeight: 700, color: "#1C1C1C", lineHeight: 1.25 }}>Notifications</h1>
          <div className="mt-3 flex flex-wrap items-center gap-2" style={{ fontSize: 13, color: "#F5A623", fontWeight: 500 }}>
            <StatusBadge status={`${unreadCount} unread`} />
            <button type="button" onClick={markAllRead} className="motion-button rounded-full px-3 py-1" style={{ background: "#F8F8F8", color: "#1C1C1C", fontSize: 12, fontWeight: 700 }}>
              Mark all read
            </button>
          </div>

          {notifications.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                icon={<Bell size={18} />}
                title="No notifications"
                body="Session reminders, approvals, and point updates will appear here."
              />
            </div>
          ) : (
            <ul className="mt-6 grid gap-2">
              {notifications.map((n) => (
                <li key={n.id} className="rounded-xl p-4 flex flex-col items-start gap-3 sm:flex-row" style={{ background: n.read ? "#FAF8F2" : "#F4F1E8" }}>
                  <span className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: "#fff" }}>
                    {n.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#1C1C1C" }}>{n.title}</div>
                      {!n.read && <StatusBadge status="Unread" />}
                    </div>
                    <div className="mt-0.5" style={{ fontSize: 13, color: "#6F6F6F", lineHeight: 1.55 }}>{n.body}</div>
                  </div>
                  <span style={{ fontSize: 12, color: "#6F6F6F" }}>{n.time}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-8 flex items-center gap-2" style={{ fontSize: 12, color: "#6F6F6F" }}>
            <Bell size={12} /> You are all caught up.
          </div>
        </div>
      </div>
    </div>
  );
}
