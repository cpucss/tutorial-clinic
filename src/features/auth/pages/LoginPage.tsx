import { useState } from "react";
import type React from "react";
import { ArrowRight, GraduationCap, IdCard, Eye, EyeOff } from "lucide-react";

import { InlineNotice, LoadingLabel } from "../../../components/common/Feedback";
import { useAppData } from "../../../context/AppDataContext";
import { signInStudent, isDefaultPassword } from "../../../services/supabase/authAdapter";

export function LoginPage() {
  const { login } = useAppData();
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    // 1. Authenticate against Supabase Database
    const { data: authData, profile, error: authError } = await signInStudent(studentId, password);

    if (authError || !authData?.user) {
      setError(authError ?? "Supabase did not return an authenticated user.");
      setLoading(false);
      return;
    }

    // 2. If using default password, we will eventually force them to change it.
    // For now, we will let them pass to verify the connection works.
    if (isDefaultPassword(studentId, password)) {
      console.log("Student is using default password. Force change flow will go here later.");
    }

    // 3. If Supabase approves, sign them into the local frontend state
    const result = login(studentId, profile?.name, profile?.role ?? undefined, authData.user.id);
    if (!result.ok) {
      setError(result.message || "Failed to load student profile.");
    }
    
    setLoading(false);
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

            <form onSubmit={submit} noValidate>
              {error && <InlineNotice tone="error" title="Unable to sign in">{error}</InlineNotice>}
              
              <label className="auth-field" htmlFor="student-id">
                <span>Student ID</span>
                <input
                  id="student-id"
                  value={studentId}
                  onChange={(event) => setStudentId(event.target.value.toUpperCase())}
                  placeholder="24-1234-56"
                  autoComplete="username"
                  inputMode="text"
                  aria-invalid={Boolean(error)}
                  autoFocus
                />
              </label>

              <label className="auth-field mt-3" htmlFor="password">
                <span>Password</span>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? "login-help login-error" : "login-help"}
                    style={{ paddingRight: "40px" }}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>

              <p id="login-help" className="auth-form-help mt-2">
                Format: YY-XXXX-ZZ. For your first login, your password is your ID without dashes (e.g. 24123456).
              </p>
              
              {error && <span id="login-error" className="sr-only">{error}</span>}
              
              <button type="submit" className="auth-submit mt-5" disabled={loading || !studentId || !password}>
                {loading ? <LoadingLabel label="Authenticating..." /> : <><span>Login</span><ArrowRight size={16} /></>}
              </button>
            </form>

          </section>
        </div>
      </div>
    </main>
  );
}
