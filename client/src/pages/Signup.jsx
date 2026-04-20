// same auth pattern as Login.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiUrl } from '../apiBase';
import './Auth.css';

function Signup() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setPasswordError('');

    try {
      const res = await fetch(apiUrl('/api/auth/signup'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: fullName.trim(),
          email: email.trim().toLowerCase(),
          password: password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setPasswordError(data.message || 'Signup failed.');
        return;
      }

      navigate('/login');
    } catch (err) {
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

            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="auth-field">
                <label className="auth-label" htmlFor="fullName">
                  Full name
                </label>
                <input
                  className="auth-input"
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  required
                />
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
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
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
