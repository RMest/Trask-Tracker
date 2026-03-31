import { useState } from "react";
import { useNavigate } from "react-router-dom";

const AUTH_KEY = "isLoggedIn";

function isValidEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function Login() {
  const [nameOrEmail, setNameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const goSignup = () => navigate("/signup");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!nameOrEmail.trim()) {
      setError("Enter your email.");
      return;
    }

    if (!isValidEmail(nameOrEmail)) {
      setError("Email format looks incorrect.");
      return;
    }

    if (!password) {
      setError("Enter your password.");
      return;
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: nameOrEmail.trim().toLowerCase(),
          password
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Login failed.");
        return;
      }
      try {
        localStorage.setItem(AUTH_KEY, "true");
        localStorage.setItem("userEmail", data.email ?? nameOrEmail.trim().toLowerCase());
      } catch {
        // ignore
      }
      navigate("/");
    } catch {
      setError("Could not reach server. Is the API running on port 8080?");
    }
  }

  return (
    <div className="login-shell login-page">
      <h1 className="login-title">
        Task <span className="builder-word">Builder</span>
      </h1>
      <div className="login-card">
        <h2 className="login-text">Log In</h2>
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={nameOrEmail}
              onChange={(e) => setNameOrEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div className="login-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error ? <div className="login-error">{error}</div> : null}

          <div className="login-actions">
            <button className="login-button" type="submit">Log in</button>
          </div>
          <div className="login-secondary-action">
            <button className="createAccount-button" type="button" onClick={goSignup}>
              Dont have an account? Create one
            </button>
          </div>
        </form>
        <p className="login-hint">Log in with an account you registered (stored in MongoDB).</p>
      </div>
    </div>
  );
}

