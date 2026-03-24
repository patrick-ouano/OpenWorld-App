import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Auth.css';

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');

  const getRedirectPath = () => {
    const fromState = location.state?.from;
    if (typeof fromState === 'string' && fromState.trim()) {
      return fromState;
    }

    const params = new URLSearchParams(location.search);
    return params.get('redirect') || '/app/map';
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');

    const emailValue = email.trim().toLowerCase();
    const passwordValue = password;
    const hasValidEmailShape = emailValue.includes('@');
    const invalidDemo = emailValue === 'invalid' || passwordValue === 'wrong';

    if (!emailValue || !hasValidEmailShape) {
      setError('Please enter a valid email.');
      return;
    }

    if (!passwordValue) {
      setError('Enter a valid password.');
      return;
    }

    if (invalidDemo) {
      setError('Invalid credentials.');
      return;
    }

    const demoToken = btoa(`${emailValue}:${Date.now()}`);
    const storage = rememberMe ? localStorage : sessionStorage;
    const otherStorage = rememberMe ? sessionStorage : localStorage;

    otherStorage.removeItem('authToken');
    otherStorage.removeItem('authUser');
    storage.setItem('authToken', demoToken);
    storage.setItem('authUser', emailValue);

    navigate(getRedirectPath());
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <section className="auth-form-panel">
          <div className="auth-form-wrap">
            <h1 className="auth-title">Welcome back</h1>
            <p className="auth-subtitle">Log in to continue your OpenWorld journey.</p>

            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              <div className="auth-field">
                <label className="auth-label" htmlFor="email">
                  Email
                </label>
                <input
                  className="auth-input"
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
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
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </div>

              <label className="auth-remember-row" htmlFor="rememberMe">
                <input
                  className="auth-checkbox"
                  id="rememberMe"
                  name="rememberMe"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                />
                Remember Me
              </label>

              {error ? <p className="auth-error">{error}</p> : null}

              <button className="auth-submit" type="submit">
                Log in
              </button>
            </form>

            <p className="auth-footer">
              New to OpenWorld? <Link className="auth-link" to="/signup">Create an account</Link>
            </p>
          </div>
        </section>

        <aside className="auth-image-panel" aria-hidden="true" />
      </section>
    </main>
  );
}

export default Login;
