import { useState } from "react";
import type React from "react";
import { ArrowRight, GraduationCap, IdCard } from "lucide-react";

import { InlineNotice, LoadingLabel } from "../../../components/common/Feedback";
import { useAppData } from "../../../context/AppDataContext";

export function LoginPage() {
  const { login } = useAppData();
  const [studentId, setStudentId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    window.setTimeout(() => {
      const result = login(studentId);
      if (!result.ok) setError(result.message);
      setLoading(false);
    }, 280);
  }

  return (
    <main className="auth-page">
      <div className="auth-panel">
        <header className="auth-brand">
          <div className="auth-brand-mark" aria-hidden="true">TC</div>
          <div>
            <div className="auth-brand-name">CCS Tutorial Clinic</div>
            <div className="auth-brand-sub">Computer Science Society</div>
          </div>
        </header>

        <div className="auth-grid">
          <section className="auth-story" aria-labelledby="welcome-title">
            <div className="auth-story-badge"><GraduationCap size={15} /> Peer-supported learning</div>
            <h1 id="welcome-title">Study together. Show up prepared. Share what you know.</h1>
            <p>Access tutorial sessions, attendance, shared notes, contribution points, and your personal study schedule in one focused workspace.</p>
            <div className="auth-story-cards" aria-label="Application highlights">
              <div><span>01</span><strong>Find a clinic</strong><small>Browse sessions built around the subjects students need most.</small></div>
              <div><span>02</span><strong>Track progress</strong><small>Keep attendance, points, and approved contributions visible.</small></div>
              <div><span>03</span><strong>Help the community</strong><small>Submit useful notes for review and earn contribution points.</small></div>
            </div>
          </section>

          <section className="auth-card" aria-labelledby="login-title">
            <div className="auth-card-icon"><IdCard size={19} /></div>
            <h2 id="login-title">Student sign in</h2>
            <p>Enter your assigned Student ID to continue.</p>

            <form onSubmit={submit} noValidate>
              {error && <InlineNotice tone="error" title="Unable to sign in">{error}</InlineNotice>}
              <label className="auth-field" htmlFor="student-id">
                <span>Student ID</span>
                <input
                  id="student-id"
                  value={studentId}
                  onChange={(event) => setStudentId(event.target.value.toUpperCase())}
                  placeholder="2024-00421"
                  autoComplete="username"
                  inputMode="text"
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? "login-help login-error" : "login-help"}
                  autoFocus
                />
              </label>
              <p id="login-help" className="auth-form-help">Format: YYYY-00000. Administrators may use their assigned ADMIN ID.</p>
              {error && <span id="login-error" className="sr-only">{error}</span>}
              <button type="submit" className="auth-submit" disabled={loading}>
                {loading ? <LoadingLabel label="Checking Student ID" /> : <><span>Login</span><ArrowRight size={16} /></>}
              </button>
            </form>

          </section>
        </div>
      </div>
    </main>
  );
}
