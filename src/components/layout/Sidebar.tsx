import {
  Home,
  Calendar,
  History,
  Trophy,
  BookOpen,
  User,
  BookMarked,
  Bell,
  Star,
  FileText,
  LayoutDashboard,
  ClipboardList,
  ListChecks,
  NotebookTabs,
  UsersRound,
  ChevronsUpDown,
} from "lucide-react";
import { motion } from "motion/react";
import type React from "react";
import type { User as AppUser } from "../../types/user";

export type TabKey =
  | "dashboard"
  | "events"
  | "attendance-history"
  | "leaderboard"
  | "notes"
  | "profile"
  | "points"
  | "notifications"
  | "favourites"
  | "my-notes"
  | "admin-dashboard"
  | "admin-attendance"
  | "admin-sessions"
  | "admin-notes"
  | "admin-students"
  | "admin-subjects";

type NavItem = {
  key: TabKey;
  label: string;
  icon: React.ReactNode;
};

const utilityItems: NavItem[] = [
  {
    key: "points",
    label: "Points Guide",
    icon: <BookMarked size={18} strokeWidth={1.75} />,
  },
  {
    key: "notifications",
    label: "Notifications",
    icon: <Bell size={18} strokeWidth={1.75} />,
  },
];

const workspaceItems: NavItem[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: <Home size={18} strokeWidth={1.75} />,
  },
  {
    key: "events",
    label: "Events",
    icon: <Calendar size={18} strokeWidth={1.75} />,
  },
  {
    key: "attendance-history",
    label: "Attendance",
    icon: <History size={18} strokeWidth={1.75} />,
  },
  {
    key: "leaderboard",
    label: "Leaderboard",
    icon: <Trophy size={18} strokeWidth={1.75} />,
  },
  {
    key: "notes",
    label: "Notes Library",
    icon: <BookOpen size={18} strokeWidth={1.75} />,
  },
];

const personalItems: NavItem[] = [
  {
    key: "my-notes",
    label: "My Notes",
    icon: <FileText size={18} strokeWidth={1.75} />,
  },
  {
    key: "favourites",
    label: "Favourites",
    icon: <Star size={18} strokeWidth={1.75} />,
  },
  {
    key: "profile",
    label: "Profile",
    icon: <User size={18} strokeWidth={1.75} />,
  },
];

const adminItems: NavItem[] = [
  {
    key: "admin-dashboard",
    label: "Admin Dashboard",
    icon: <LayoutDashboard size={18} strokeWidth={1.75} />,
  },
  {
    key: "admin-attendance",
    label: "Admin Attendance",
    icon: <ClipboardList size={18} strokeWidth={1.75} />,
  },
  {
    key: "admin-sessions",
    label: "Admin Sessions",
    icon: <ListChecks size={18} strokeWidth={1.75} />,
  },
  {
    key: "admin-notes",
    label: "Admin Notes",
    icon: <FileText size={18} strokeWidth={1.75} />,
  },
  {
    key: "admin-students",
    label: "Admin Students",
    icon: <UsersRound size={18} strokeWidth={1.75} />,
  },
  {
    key: "admin-subjects",
    label: "Admin Subjects",
    icon: <NotebookTabs size={18} strokeWidth={1.75} />,
  },
];

export function Sidebar({
  active,
  onChange,
  role,
}: {
  active: TabKey;
  onChange: (k: TabKey) => void;
  role: AppUser["role"];
}) {
  const canSeeAdmin = role === "admin";

  return (
    <aside
      className="app-sidebar w-[220px] shrink-0 h-dvh overflow-y-auto flex flex-col px-3 py-5"
      style={{ background: "#FFFFFF" }}
      aria-label="Primary navigation"
    >
      <div className="sidebar-brand flex items-center justify-between px-2 mb-5">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: "#F5A623" }}
          >
            <span
              style={{
                color: "#fff",
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              T
            </span>
          </div>

          <span
            className="truncate"
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: "#1C1C1C",
            }}
          >
            CCS Tutorial Clinic
          </span>
        </div>

        <ChevronsUpDown
          size={15}
          color="#6F6F6F"
          strokeWidth={1.75}
        />
      </div>

      <NavGroup
        items={utilityItems}
        active={active}
        onChange={onChange}
      />

      <div
        className="sidebar-section-label px-2 mt-5 mb-2"
        style={{
          fontSize: 11,
          letterSpacing: "0.08em",
          color: "#6F6F6F",
        }}
      >
        WORKSPACE
      </div>

      <NavGroup
        items={workspaceItems}
        active={active}
        onChange={onChange}
      />

      <div
        className="sidebar-section-label px-2 mt-5 mb-2"
        style={{
          fontSize: 11,
          letterSpacing: "0.08em",
          color: "#6F6F6F",
        }}
      >
        PERSONAL
      </div>

      <NavGroup
        items={personalItems}
        active={active}
        onChange={onChange}
      />

      {canSeeAdmin && (
        <>
          <div
            className="sidebar-section-label px-2 mt-5 mb-2"
            style={{
              fontSize: 11,
              letterSpacing: "0.08em",
              color: "#6F6F6F",
            }}
          >
            ADMIN
          </div>

          <NavGroup
            items={adminItems}
            active={active}
            onChange={onChange}
          />
        </>
      )}

      <div
        className="sidebar-footer mt-auto px-3 pt-4"
        style={{
          borderTop: "1px solid #F0EFE9",
        }}
      >
        <div
          style={{
            fontSize: 12,
            color: "#6F6F6F",
          }}
        >
          CCS Tutorial Clinic MVP
        </div>
      </div>
    </aside>
  );
}

function NavGroup({
  items,
  active,
  onChange,
}: {
  items: NavItem[];
  active: TabKey;
  onChange: (k: TabKey) => void;
}) {
  return (
    <nav className="flex flex-col gap-1">
      {items.map((it) => {
        const isActive = active === it.key;

        return (
          <motion.button
            key={it.key}
            type="button"
            onClick={() => onChange(it.key)}
            className="nav-button relative flex items-center gap-3 py-2 px-3 rounded-md text-left transition-colors"
            aria-current={isActive ? "page" : undefined}
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 420, damping: 30 }}
            style={{
              background: isActive ? "#FAF8F2" : "transparent",
              color: "#1C1C1C",
              fontSize: 14,
              fontWeight: isActive ? 700 : 400,
            }}
          >
            {isActive && (
              <motion.span
                layoutId="sidebar-active-rail"
                className="sidebar-active-rail absolute left-0 top-1 bottom-1 w-[3px] rounded-full"
                style={{
                  background: "#F5A623",
                }}
                transition={{ type: "spring", stiffness: 520, damping: 34 }}
              />
            )}

            <span
              style={{
                color: isActive ? "#F5A623" : "#2D2D2D",
              }}
            >
              {it.icon}
            </span>

            <span className="truncate">{it.label}</span>
          </motion.button>
        );
      })}
    </nav>
  );
}
