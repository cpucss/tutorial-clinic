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
  Settings,
  CalendarDays,
  Megaphone,
  LifeBuoy,
  Activity,
  LayoutGrid,
  QrCode,
  ScanLine,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import type React from "react";
import type { DemoUser } from "../../types/app";

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
  | "settings"
  | "schedule"
  | "points-history"
  | "announcements"
  | "help"
  | "admin-dashboard"
  | "admin-attendance"
  | "admin-sessions"
  | "admin-notes"
  | "admin-students";

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
  {
    key: "settings",
    label: "Settings",
    icon: <Settings size={18} strokeWidth={1.75} />,
  },
  { key: "announcements", label: "Announcements", icon: <Megaphone size={18} strokeWidth={1.75} /> },
  { key: "help", label: "Help & Support", icon: <LifeBuoy size={18} strokeWidth={1.75} /> },
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
  { key: "schedule", label: "My Schedule", icon: <CalendarDays size={18} strokeWidth={1.75} /> },
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
  { key: "points-history", label: "Point History", icon: <Activity size={18} strokeWidth={1.75} /> },
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
];

export function Sidebar({
  active,
  onChange,
  onQrMode,
  role,
}: {
  active: TabKey;
  onChange: (k: TabKey) => void;
  onQrMode: () => void;
  role: DemoUser["role"];
}) {
  const canSeeAdmin = role === "admin";
  const [moreOpen, setMoreOpen] = useState(false);
  const roleUtilityItems = canSeeAdmin
    ? utilityItems.filter((item) => item.key !== "points")
    : utilityItems;
  const featureCount = roleUtilityItems.length + (canSeeAdmin
    ? adminItems.length
    : workspaceItems.length + personalItems.length);

  useEffect(() => setMoreOpen(false), [active]);

  function choose(key: TabKey) {
    setMoreOpen(false);
    onChange(key);
  }

  return (
    <aside
      className="app-sidebar w-[220px] shrink-0 h-dvh"
      style={{ background: "#FFFFFF" }}
      aria-label="Primary navigation"
    >
      <div className="sidebar-desktop-content">
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
          items={roleUtilityItems}
          active={active}
          onChange={onChange}
        />

        {!canSeeAdmin && <><div
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
        /></>}

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
            CCS Tutorial Clinic
          </div>
        </div>
      </div>

      <nav className="mobile-nav-bar" aria-label="Mobile navigation">
        <button className="mobile-nav-button mobile-nav-qr" type="button" onClick={onQrMode} aria-label={canSeeAdmin ? "Scan student QR" : "My attendance QR"} aria-haspopup="dialog">
          <span className="mobile-nav-action-icon">{canSeeAdmin ? <ScanLine size={21} strokeWidth={2} /> : <QrCode size={21} strokeWidth={2} />}</span>
          <span>{canSeeAdmin ? "Scan student QR" : "My QR"}</span>
        </button>
        <button className={`mobile-nav-button mobile-nav-hub ${moreOpen ? "is-active" : ""}`} type="button" onClick={() => setMoreOpen(true)} aria-label="More" aria-haspopup="dialog" aria-expanded={moreOpen}>
          <span className="mobile-nav-action-icon"><LayoutGrid size={21} strokeWidth={2} /></span>
          <span>Navigation hub</span>
        </button>
      </nav>

      {moreOpen && <div className="mobile-more-overlay" onMouseDown={() => setMoreOpen(false)}>
        <section className="mobile-more-sheet" role="dialog" aria-modal="true" aria-labelledby="mobile-navigation-title" onMouseDown={(event) => event.stopPropagation()}>
          <header>
            <div><span>Navigation hub</span><h2 id="mobile-navigation-title">All features</h2><p>{featureCount} tools available for your account</p></div>
            <button className="mobile-sheet-close" type="button" aria-label="Close mobile navigation" onClick={() => setMoreOpen(false)}><X size={18} /></button>
          </header>
          <div className="mobile-more-content">
            <MobileMenuGroup label="Account & updates" items={roleUtilityItems} active={active} onChange={choose} />
            {!canSeeAdmin && <><MobileMenuGroup label="Workspace" items={workspaceItems} active={active} onChange={choose} /><MobileMenuGroup label="Personal" items={personalItems} active={active} onChange={choose} /></>}
            {canSeeAdmin && <MobileMenuGroup label="Administration" items={adminItems} active={active} onChange={choose} />}
          </div>
        </section>
      </div>}
    </aside>
  );
}

function MobileMenuGroup({ label, items, active, onChange }: { label: string; items: NavItem[]; active: TabKey; onChange: (key: TabKey) => void }) {
  return <section className="mobile-menu-group"><h3>{label}</h3><div>{items.map((item) => <button type="button" key={item.key} className={active === item.key ? "is-active" : ""} aria-current={active === item.key ? "page" : undefined} onClick={() => onChange(item.key)}><span>{item.icon}</span><strong>{item.label}</strong></button>)}</div></section>;
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
