import { useEffect, useRef, useState } from "react";
import type React from "react";
import { Check, Eye, EyeOff, LockKeyhole, ShieldCheck } from "lucide-react";

import { InlineNotice } from "../../../components/common/Feedback";
import { useAppData } from "../../../context/AppDataContext";

export function AccountSetupModal({ onComplete }: { onComplete: () => void }) {
  const { currentUser, completeAccountSetup } = useAppData();
  const panelRef = useRef<HTMLDivElement>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const focusable = () => Array.from(panel.querySelectorAll<HTMLElement>('input, button:not([disabled])'));
    focusable()[0]?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const items = focusable();
      const first = items[0];
      const last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  if (!currentUser) return null;
  const requirements = [
    [password.length >= 8, "At least eight characters"],
    [/[A-Z]/.test(password), "At least one uppercase letter"],
    [/[a-z]/.test(password), "At least one lowercase letter"],
    [/\d/.test(password), "At least one number"],
  ] as const;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    setSaving(true);
    const result = await completeAccountSetup(password);
    setSaving(false);
    if (!result.ok) { setError(result.message); return; }
    onComplete();
  }

  async function skipSetup() {
    await completeAccountSetup("", true);
    onComplete();
  }

  return (
    <div className="setup-overlay" role="presentation">
      <div ref={panelRef} className="setup-dialog" role="dialog" aria-modal="true" aria-labelledby="setup-title" aria-describedby="setup-description">
        <div className="setup-icon"><LockKeyhole size={22} /></div>
        <div>
          <div className="section-kicker">First login</div>
          <h1 id="setup-title">Welcome, {currentUser.name.split(" ")[0]}!</h1>
          <p id="setup-description">Before continuing, replace your temporary password with a secure password.</p>
        </div>
        <InlineNotice tone="info" title="Supabase security">Your password is updated directly through Supabase Auth and is never stored in the app's local data.</InlineNotice>
        {error && <InlineNotice tone="error" title="Check your account details">{error}</InlineNotice>}
        <form onSubmit={submit} className="setup-form" noValidate>
          <label><span>Student ID</span><input value={currentUser.studentId} readOnly /></label>
          <label><span>Create password</span><div className="password-field"><input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></label>
          <label><span>Confirm password</span><input type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" /></label>
          <ul className="password-requirements" aria-label="Password requirements">
            {requirements.map(([met, label]) => <li key={label} data-met={met}><Check size={13} />{label}</li>)}
          </ul>
          
          <div className="flex gap-3 mt-2">
            <button type="button" className="secondary-button flex-1" onClick={skipSetup} disabled={saving}>I'll do it later</button>
            <button type="submit" className="primary-button setup-submit flex-1 m-0" disabled={saving}><ShieldCheck size={15} /> {saving ? "Saving..." : "Save Password"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
