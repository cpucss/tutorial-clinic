import { useState } from "react";
import { Accessibility, BellRing, Check, Eye, EyeOff, RotateCcw, ShieldCheck } from "lucide-react";
import type { ToastMessage } from "../../../components/common/Feedback";
import { InlineNotice } from "../../../components/common/Feedback";
import { useAppData } from "../../../context/AppDataContext";
import { defaultPreferences } from "../../../data/seed";
import type { Preferences } from "../../../types/app";

export function SettingsPage({ onNotify }: { onNotify?: (toast: Omit<ToastMessage, "id">) => void }) {
  const { state, currentUser, updatePreferences, completeAccountSetup } = useAppData();
  const persisted = currentUser ? state.preferences[currentUser.id] ?? defaultPreferences : defaultPreferences;
  const [preferences, setPreferences] = useState<Preferences>(persisted);
  
  const [setupEmail, setSetupEmail] = useState(currentUser?.accountSetup?.backupEmail ?? "");
  const [setupPassword, setSetupPassword] = useState("");
  const [setupConfirmPassword, setSetupConfirmPassword] = useState("");
  const [showSetupPassword, setShowSetupPassword] = useState(false);
  const [setupError, setSetupError] = useState("");

  function toggle(key: keyof Preferences) { setPreferences((current) => ({ ...current, [key]: !current[key] })); }
  function save() { updatePreferences(preferences); onNotify?.({ tone: "success", title: "Preferences saved", description: "Your display and notification preferences are stored with this account." }); }
  function reset() { setPreferences({ ...defaultPreferences }); updatePreferences({ ...defaultPreferences }); onNotify?.({ tone: "info", title: "Preferences reset", description: "Default settings were restored." }); }

  function handleSaveSecurity(e: React.FormEvent) {
    e.preventDefault();
    setSetupError("");
    if (currentUser.role !== "admin" && !setupEmail.trim().toLowerCase().endsWith("@cpu.edu.ph")) {
      setSetupError("Please enter a valid @cpu.edu.ph email address.");
      return;
    }
    if (setupPassword !== setupConfirmPassword) {
      setSetupError("Passwords do not match.");
      return;
    }
    const res = completeAccountSetup(currentUser.role === "admin" ? "" : setupEmail, setupPassword);
    if (!res.ok) {
      setSetupError(res.message);
      return;
    }
    onNotify?.({ tone: "success", title: "Account setup complete", description: "Your security credentials have been configured successfully!" });
    setSetupPassword("");
    setSetupConfirmPassword("");
  }

  if (!currentUser) return null;
  return <div className="h-full overflow-y-auto"><div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-10 lg:py-8"><header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><div className="section-kicker">Account</div><h1 className="page-heading">Settings</h1><p className="page-description">Tune accessibility, display density, and in-app update preferences.</p></div><button className="secondary-button" onClick={reset}><RotateCcw size={15} /> Reset defaults</button></header><div className="mt-6 grid items-start gap-5 xl:grid-cols-[1fr_310px]"><div className="grid gap-5">
  
  <SettingsSection icon={<ShieldCheck />} title="Account security" description="Manage your login credentials.">
    <div className="p-4" style={{ borderBottom: "1px solid #F0EFE9" }}>
      {setupError && <div style={{ marginBottom: '1rem' }}><InlineNotice tone="error" title="Security settings error">{setupError}</InlineNotice></div>}
      <form onSubmit={handleSaveSecurity} className="setup-form" noValidate style={{ marginTop: 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {currentUser.role !== "admin" && (
            <label><span>CPU email address</span><input type="email" value={setupEmail} onChange={(e) => setSetupEmail(e.target.value)} placeholder="firstname.lastname-xx@cpu.edu.ph" autoComplete="email" /></label>
          )}
          <label><span>New password</span><input type={showSetupPassword ? "text" : "password"} value={setupPassword} onChange={(e) => setSetupPassword(e.target.value)} autoComplete="new-password" /></label>
          <label><span>Confirm password</span><input type={showSetupPassword ? "text" : "password"} value={setupConfirmPassword} onChange={(e) => setSetupConfirmPassword(e.target.value)} autoComplete="new-password" /></label>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '.75rem' }}>
          <button type="button" className="secondary-button" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', height: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => setShowSetupPassword(!showSetupPassword)}>
            {showSetupPassword ? <EyeOff size={13} /> : <Eye size={13} />}
            {showSetupPassword ? "Hide password" : "Show password"}
          </button>
          <button type="submit" className="primary-button" style={{ height: 'auto', padding: '0.5rem 1.2rem', margin: 0 }}><ShieldCheck size={14} /> Update Security</button>
        </div>
      </form>
    </div>
  </SettingsSection>
  
  <SettingsSection icon={<Accessibility />} title="Accessibility and display" description="Choose calmer motion, stronger contrast, or denser desktop navigation."><Preference title="Reduce motion" body="Stops page transitions and hover movement." checked={preferences.reducedMotion} onClick={() => toggle("reducedMotion")} /><Preference title="Higher contrast" body="Strengthens secondary text and control boundaries." checked={preferences.highContrast} onClick={() => toggle("highContrast")} /><Preference title="Compact navigation" body="Fits more destinations in the desktop sidebar." checked={preferences.compactNavigation} onClick={() => toggle("compactNavigation")} /></SettingsSection><SettingsSection icon={<BellRing />} title="Notification preferences" description="These settings prepare the UI for future backend notification delivery."><Preference title="Session reminders" body="RSVP reminders and venue changes." checked={preferences.sessionReminders} onClick={() => toggle("sessionReminders")} /><Preference title="Notes review updates" body="Approval and rejection results." checked={preferences.noteUpdates} onClick={() => toggle("noteUpdates")} /><Preference title="Leaderboard updates" body="Rank changes and milestones." checked={preferences.leaderboardUpdates} onClick={() => toggle("leaderboardUpdates")} /></SettingsSection><div className="flex justify-end"><button className="primary-button" onClick={save}><Check size={15} /> Save preferences</button></div></div><aside className="rounded-xl bg-white p-5 demo-card"><div className="profile-avatar small"><Eye /></div><h2 className="mt-3 text-lg font-bold">{currentUser.name}</h2><p className="text-sm text-[#6F6F6F]">{currentUser.studentId}</p><dl className="detail-list"><div><dt>Account setup</dt><dd>{currentUser.accountSetup.completed ? "Complete" : currentUser.accountSetup.skipped ? "Skipped (Pending)" : "Pending"}</dd></div><div><dt>School email</dt><dd>{currentUser.accountSetup.backupEmail || (currentUser.role === "admin" ? "Not required" : "Not configured")}</dd></div><div><dt>Access</dt><dd>{currentUser.role}</dd></div></dl><InlineNotice tone="warning" title="Local account storage"><ShieldCheck size={14} className="inline" /> Account setup details are not securely authenticated.</InlineNotice></aside></div></div></div>;
}
function SettingsSection({ icon, title, description, children }: { icon: React.ReactNode; title: string; description: string; children: React.ReactNode }) { return <section className="settings-section"><div className="settings-section-heading"><span>{icon}</span><div><h2>{title}</h2><p>{description}</p></div></div><div className="settings-list">{children}</div></section>; }
function Preference({ title, body, checked, onClick }: { title: string; body: string; checked: boolean; onClick: () => void }) { return <div className="preference-row"><div className="flex-1"><div className="preference-title">{title}</div><div className="preference-body">{body}</div></div><button type="button" className="preference-switch" role="switch" aria-checked={checked} aria-label={title} onClick={onClick}><span /></button></div>; }
