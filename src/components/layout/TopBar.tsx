import { useState } from "react";
import { Bell, LogOut, MoreHorizontal, Settings, Share2, UserRound } from "lucide-react";

import type { User } from "../../types/user";
import type { TabKey } from "./Sidebar";

const breadcrumbTargets: Record<string, TabKey> = {
  Dashboard: "dashboard",
  Events: "events",
  Attendance: "attendance-history",
  Leaderboard: "leaderboard",
  "Notes Library": "notes",
  "My Profile": "profile",
  "Points Guideline": "points",
  Notifications: "notifications",
  Favourites: "favourites",
  "My Notes": "my-notes",
  Admin: "admin-dashboard",
  Sessions: "admin-sessions",
  "Notes Approval": "admin-notes",
  Students: "admin-students",
  Subjects: "admin-subjects",
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function TopBar({
  title,
  user,
  onNavigate,
  onLogout,
  onShare,
}: {
  title: string;
  user: User;
  onNavigate: (tab: TabKey) => void;
  onLogout: () => void;
  onShare: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const parts = title.split("/").map((part) => part.trim()).filter(Boolean);

  return (
    <div className="top-bar relative min-h-12 px-6 py-2 flex items-center justify-between gap-4" style={{ background: "#fff" }}>
      <nav className="topbar-breadcrumbs" aria-label="Breadcrumb">
        {parts.map((part, index) => {
          const target = breadcrumbTargets[part];
          const isLast = index === parts.length - 1;
          return (
            <span key={`${part}-${index}`} className="min-w-0 flex items-center gap-1">
              {target && !isLast ? (
                <button type="button" className="topbar-crumb" onClick={() => onNavigate(target)}>
                  {part}
                </button>
              ) : (
                <span className="topbar-crumb" aria-current={isLast ? "page" : undefined}>
                  {part}
                </span>
              )}
              {!isLast && <span aria-hidden="true">/</span>}
            </span>
          );
        })}
      </nav>
      <div className="flex shrink-0 items-center gap-4">
        <button
          type="button"
          className="motion-button top-action rounded-full px-3 py-1 flex items-center gap-1.5"
          style={{ fontSize: 13, fontWeight: 700, color: "#1C1C1C" }}
          onClick={onShare}
        >
          <Share2 size={14} />
          Share
        </button>
        <button
          type="button"
          className="icon-button motion-button rounded-full relative"
          aria-label="Notifications"
          onClick={() => onNavigate("notifications")}
        >
          <Bell size={16} color="#2D2D2D" strokeWidth={1.75} />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full" style={{ background: "#E69B22" }} />
        </button>
        <button
          type="button"
          className="avatar-pop w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: "#1C1C1C", color: "#fff", fontSize: 11, fontWeight: 800, border: "2px solid #fff" }}
          onClick={() => setMenuOpen((open) => !open)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-label="Open user menu"
        >
          {initials(user.name)}
        </button>
        <button
          type="button"
          className="icon-button motion-button rounded-full"
          aria-label="More options"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <MoreHorizontal size={16} color="#2D2D2D" strokeWidth={1.75} />
        </button>

        {menuOpen && (
          <div className="user-menu" role="menu">
            <div className="user-menu-header">
              <div style={{ fontSize: 13, fontWeight: 800, color: "#1C1C1C" }}>{user.name}</div>
              <div style={{ fontSize: 12, color: "#6F6F6F" }}>
                {user.role} / {user.email}
              </div>
            </div>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                onNavigate("profile");
              }}
            >
              <UserRound size={15} /> Profile
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => setMenuOpen(false)}
            >
              <Settings size={15} /> Settings
            </button>
            <button type="button" role="menuitem" onClick={onLogout}>
              <LogOut size={15} /> Log out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
