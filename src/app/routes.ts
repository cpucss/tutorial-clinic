import type { TabKey } from "../components/layout/Sidebar";

export const TAB_PATHS: Record<TabKey, string> = {
  dashboard: "/dashboard",
  events: "/events",
  "attendance-history": "/attendance",
  leaderboard: "/leaderboard",
  notes: "/notes",
  profile: "/profile",
  points: "/points-guide",
  notifications: "/notifications",
  favourites: "/favourites",
  "my-notes": "/my-notes",
  settings: "/settings",
  schedule: "/schedule",
  "points-history": "/points-history",
  announcements: "/announcements",
  help: "/help",
  "admin-dashboard": "/admin",
  "admin-attendance": "/admin/attendance",
  "admin-sessions": "/admin/sessions",
  "admin-subjects": "/admin/subjects",
  "admin-notes": "/admin/notes",
  "admin-students": "/admin/students",
};

const PATH_TABS = Object.entries(TAB_PATHS).reduce<Record<string, TabKey>>(
  (lookup, [tab, path]) => {
    lookup[path] = tab as TabKey;
    return lookup;
  },
  {},
);

export function tabFromPath(pathname: string): TabKey | null {
  const normalized = pathname.length > 1 ? pathname.replace(/\/$/, "") : pathname;
  return PATH_TABS[normalized] ?? null;
}
