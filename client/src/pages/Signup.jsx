// Signup flow mirrors Login.jsx (controlled inputs + fetch + navigate).
// React forms / state: https://react.dev/learn/reacting-to-input-with-state
// useNavigate after success: https://reactrouter.com/en/main/hooks/use-navigate
// fetch() POST JSON: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
// form noValidate — skip browser’s built-in validation so we can show our username hint + errors first:
//   https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/form#novalidate
// Username pattern matches server USERNAME_RE in server/routes/auth.js (keep them in sync if you change one)
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiUrl } from '../apiBase';
import './Auth.css';

const USERNAME_PATTERN = /^[\w.-]{3,32}$/;

function Signup() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();

    setUsernameError('');
    setEmailError('');
    setPasswordError('');

    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    const usernameTrim = username.trim();
    if (!usernameTrim) {
      setUsernameError('Please enter a username.');
      return;
    }
    if (!USERNAME_PATTERN.test(usernameTrim)) {
      setUsernameError(
        'Username must be 3–32 characters: letters, numbers, dots, underscores, or hyphens.'
      );
      return;
    }

    try {
      const res = await fetch(apiUrl('/api/auth/signup'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: usernameTrim,
          email: email.trim().toLowerCase(),
          password: password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const msg = data.message || 'Signup failed.';
        const lower = msg.toLowerCase();
        if (lower.includes('email')) {
          setEmailError(msg);
        } else if (lower.includes('username') || lower.includes('characters')) {
          setUsernameError(msg);
        } else {
          setPasswordError(msg);
        }
        return;
      }

      navigate('/login');
    } catch {
      setPasswordError('Could not connect to server.');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-form-panel">
          <div className="auth-form-wrap">
            <h1 className="auth-title">Create account</h1>
            <p className="auth-subtitle">Sign up to get started.</p>

            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              <div className="auth-field">
                <label className="auth-label" htmlFor="username">
                  Username
                </label>
                <input
                  className="auth-input"
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  minLength={3}
                  maxLength={32}
                  value={username}
                  onChange={(event) => {
                    setUsername(event.target.value);
                    if (usernameError) setUsernameError('');
                  }}
                  required
                />
                {usernameError ? (
                  <>
                    <p className="auth-hint">This is shown on your profile.</p>
                    <p className="auth-error">{usernameError}</p>
                  </>
                ) : null}
              </div>

              <div className="auth-field">
                <label className="auth-label" htmlFor="email">
                  Email address
                </label>
                <input
                  className="auth-input"
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    if (emailError) setEmailError('');
                  }}
                  required
                />
                {emailError ? <p className="auth-error">{emailError}</p> : null}
              </div>

              <div className="auth-field">
                <label className="auth-label" htmlFor="password">
                  Password
                </label>
                <input
                  className="auth-input"
                  id="password"
                  name="password"
                  type="password"
                  minLength="8"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <p className="auth-hint">Use at least 8 characters.</p>
              </div>

              <div className="auth-field">
                <label className="auth-label" htmlFor="confirmPassword">
                  Confirm password
                </label>
                <input
                  className="auth-input"
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  minLength="8"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                />
                {passwordError ? <p className="auth-error">{passwordError}</p> : null}
              </div>

              <button className="auth-submit" type="submit">
                Create account
              </button>
            </form>

            <p className="auth-footer">
              Already have an account? <Link className="auth-link" to="/login">Log in</Link>
            </p>
          </div>
        </div>

        <div className="auth-image-panel" />
      </div>
    </div>
  );
}

export default Signup;
