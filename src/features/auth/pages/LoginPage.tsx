import { useState } from "react";
import type React from "react";
import { ArrowRight, GraduationCap, LockKeyhole, Mail, ShieldCheck } from "lucide-react";

import { demoUsers } from "../../../mock";
import type { User } from "../../../types/user";
import type { YearLevel } from "../../../types/common";
import { InlineNotice, LoadingLabel } from "../../../components/common/Feedback";

type AuthMode = "login" | "register";

const yearLevels: YearLevel[] = ["Freshman", "Sophomore", "Junior", "Senior"];

export function LoginPage({
  mode,
  onModeChange,
  onLogin,
}: {
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  onLogin: (user: User) => void;
}) {
  const [email, setEmail] = useState("aria.m@school.edu");
  const [password, setPassword] = useState("tutorialclinic");
  const [name, setName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [yearLevel, setYearLevel] = useState<YearLevel>("Freshman");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isRegister = mode === "register";

  function finishLogin(user: User) {
    setLoading(true);
    window.setTimeout(() => {
      setLoading(false);
      setError("");
      onLogin(user);
    }, 420);
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim()) {
      setError("Enter your school email or student ID.");
      return;
    }

    if (!password.trim()) {
      setError("Enter your password.");
      return;
    }

    if (isRegister) {
      if (!name.trim()) {
        setError("Enter your full name.");
        return;
      }

      if (!studentId.trim()) {
        setError("Enter your student ID.");
        return;
      }

      if (password.length < 8) {
        setError("Password must be at least 8 characters.");
        return;
      }

      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }

      finishLogin({
        id: `stu-${Date.now()}`,
        name: name.trim(),
        studentId: studentId.trim(),
        yearLevel,
        email: email.trim(),
        points: 0,
        role: "student",
      });
      return;
    }

    const match =
      demoUsers.find((user) => user.email.toLowerCase() === email.trim().toLowerCase()) ??
      demoUsers.find((user) => user.studentId.toLowerCase() === email.trim().toLowerCase());

    if (!match) {
      setError("Account not found. Use a demo shortcut or register a student account.");
      return;
    }

    finishLogin(match);
  }

  return (
    <main className="auth-page">
      <section className="auth-panel" aria-labelledby="auth-title">
        <div className="auth-brand">
          <div className="auth-brand-mark">T</div>
          <div>
            <div className="auth-brand-name">CCS Tutorial Clinic</div>
            <div className="auth-brand-sub">Study sessions, attendance, notes, and points</div>
          </div>
        </div>

        <div className="auth-grid">
          <aside className="auth-story">
            <div className="auth-story-badge">
              <GraduationCap size={16} />
              Student workspace
            </div>
            <h1 id="auth-title">Start from the right account.</h1>
            <p>
              Students get the study workspace. Admins get the moderation and attendance tools.
              The demo uses local mock accounts until the backend is connected.
            </p>
            <div className="auth-story-cards">
              <div>
                <ShieldCheck size={18} />
                <span>Role-aware navigation</span>
              </div>
              <div>
                <LockKeyhole size={18} />
                <span>Protected app shell</span>
              </div>
              <div>
                <Mail size={18} />
                <span>Ready for API auth</span>
              </div>
            </div>
          </aside>

          <form className="auth-card" onSubmit={submit} noValidate>
            <div className="auth-tabs" role="tablist" aria-label="Authentication mode">
              <button
                type="button"
                role="tab"
                aria-selected={!isRegister}
                onClick={() => {
                  setError("");
                  onModeChange("login");
                }}
              >
                Log in
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={isRegister}
                onClick={() => {
                  setError("");
                  onModeChange("register");
                }}
              >
                Register
              </button>
            </div>

            <div>
              <h2>{isRegister ? "Create student account" : "Welcome back"}</h2>
              <p>
                {isRegister
                  ? "Create a student profile for the Tutorial Clinic workspace."
                  : "Use your school email, student ID, or a demo shortcut."}
              </p>
            </div>

            {error && (
              <InlineNotice tone="error" title="Check the form">
                {error}
              </InlineNotice>
            )}

            {isRegister && (
              <>
                <AuthField label="Full name">
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Aria Mendoza"
                    autoComplete="name"
                  />
                </AuthField>

                <AuthField label="Student ID">
                  <input
                    value={studentId}
                    onChange={(event) => setStudentId(event.target.value)}
                    placeholder="2024-00421"
                    autoComplete="off"
                  />
                </AuthField>

                <AuthField label="Year level">
                  <select value={yearLevel} onChange={(event) => setYearLevel(event.target.value as YearLevel)}>
                    {yearLevels.map((year) => (
                      <option key={year}>{year}</option>
                    ))}
                  </select>
                </AuthField>
              </>
            )}

            <AuthField label={isRegister ? "School email" : "School email or student ID"}>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="aria.m@school.edu"
                autoComplete="email"
              />
            </AuthField>

            <AuthField label="Password">
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                placeholder="8 characters minimum"
                autoComplete={isRegister ? "new-password" : "current-password"}
              />
            </AuthField>

            {isRegister && (
              <AuthField label="Confirm password">
                <input
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  type="password"
                  placeholder="Repeat password"
                  autoComplete="new-password"
                />
              </AuthField>
            )}

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? <LoadingLabel label={isRegister ? "Creating account" : "Signing in"} /> : isRegister ? "Create account" : "Log in"}
              {!loading && <ArrowRight size={15} />}
            </button>

            {!isRegister && (
              <div className="auth-demo-row">
                <button type="button" onClick={() => finishLogin(demoUsers[0])}>
                  Demo student
                </button>
                <button type="button" onClick={() => finishLogin(demoUsers[1])}>
                  Demo admin
                </button>
              </div>
            )}
          </form>
        </div>
      </section>
    </main>
  );
}

function AuthField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="auth-field">
      <span>{label}</span>
      {children}
    </label>
  );
}
