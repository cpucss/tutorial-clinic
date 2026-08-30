import { useState } from "react";
import type React from "react";
import { ArrowRight, GraduationCap, IdCard, Eye, EyeOff } from "lucide-react";

import { InlineNotice, LoadingLabel } from "../../../components/common/Feedback";
import { useAppData } from "../../../context/AppDataContext";
import { signInStudent, isDefaultPassword, isValidStudentId } from "../../../services/supabase/authAdapter";

export function LoginPage() {
  const { login } = useAppData();
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement> | React.SyntheticEvent) {
    if (event && event.preventDefault) event.preventDefault();
    setError("");

    const domInput = (document.getElementById("student-id") as HTMLInputElement)?.value;
    const domPassword = (document.getElementById("password") as HTMLInputElement)?.value;
    const currentStudentId = domInput !== undefined && domInput !== "" ? domInput : studentId;
    const currentPassword = domPassword !== undefined && domPassword !== "" ? domPassword : password;

    const trimmed = currentStudentId.trim();
    if (!trimmed) {
      setError("Student ID is required.");
      return;
    }

    if (!isValidStudentId(trimmed)) {
      setError("Invalid Student ID format. Use YYYY-00000.");
      return;
    }

    if (currentPassword) {
      setLoading(true);
      const { account, error: authError } = await signInStudent(trimmed, currentPassword);

      if (authError || !account?.user) {
        setError(authError ?? "Supabase did not return an authenticated user.");
        setLoading(false);
        return;
      }

      if (isDefaultPassword(trimmed, currentPassword)) {
        console.log("Student is using default password.");
      }

      const result = login(trimmed, account.profile?.name, account.profile?.role ?? undefined, account.user.id, currentPassword);
      if (!result.ok) {
        setError(result.message || "Failed to load student profile.");
      }
      setLoading(false);
    } else {
      // Direct synchronous login for demo and pre-configured environments
      const result = login(trimmed);
      if (!result.ok) {
        setError(result.message || "Failed to load student profile.");
      }
    }
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
            <p>Enter your assigned Student ID and password to continue.</p>

            {error && <InlineNotice tone="error" title="Could not sign in">{error}</InlineNotice>}

            <form onSubmit={submit} noValidate>
              <label className="auth-field" htmlFor="student-id">
                <span>Student ID</span>
                <input
                  id="student-id"
                  inputMode="text"
                  autoComplete="username"
                  placeholder="24-1234-56"
                  value={studentId}
                  onChange={(event) => setStudentId(event.target.value)}
                  aria-invalid={Boolean(error)}
                />
              </label>

              <label className="auth-field mt-3" htmlFor="password">
                <span>Password (Optional for demo)</span>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    aria-invalid={Boolean(error)}
                    aria-describedby="login-help"
                    style={{ paddingRight: "40px" }}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>

              <p className="auth-form-help mt-2" id="login-help">
                Format: YY-XXXX-ZZ. For your first login, your password is your ID without dashes (e.g. 24123456).
              </p>

              <button className="auth-submit mt-5" type="submit" disabled={loading}>
                {loading ? <LoadingLabel label="Signing in..." /> : <><span>Login</span><ArrowRight size={16} /></>}
              </button>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}
