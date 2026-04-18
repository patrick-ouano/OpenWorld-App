// login form referenced from https://react.dev/reference/react-dom/components/form
// saving jwt token idea from https://www.freecodecamp.org/news/how-to-authenticate-users-in-your-node-app-using-cookies-sessions-and-jwt/
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiUrl } from '../apiBase';
import './Auth.css';

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    const emailValue = email.trim().toLowerCase();

    if (!emailValue || !emailValue.includes('@')) {
      setError('Please enter a valid email.');
      return;
    }

    if (!password) {
      setError('Enter a valid password.');
      return;
    }

    try {
      const res = await fetch(apiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailValue,
          password: password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Invalid credentials.');
        return;
      }

      localStorage.setItem('authToken', data.token);
      localStorage.setItem('authUser', JSON.stringify(data.user));

      navigate('/app/map');
    } catch (err) {
      setError('Could not connect to server.');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-form-panel">
          <div className="auth-form-wrap">
            <h1 className="auth-title">Welcome back</h1>
            <p className="auth-subtitle">Log in to continue your OpenWorld journey.</p>

            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="auth-field">
                <label className="auth-label" htmlFor="email">
                  Email
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
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </div>

              {error ? <p className="auth-error">{error}</p> : null}

              <button className="auth-submit" type="submit">
                Log in
              </button>
            </form>

            <p className="auth-footer">
              New to OpenWorld? <Link className="auth-link" to="/signup">Create an account</Link>
            </p>
          </div>
        </div>

        <div className="auth-image-panel" />
      </div>
    </div>
  );
}

export default Login;
