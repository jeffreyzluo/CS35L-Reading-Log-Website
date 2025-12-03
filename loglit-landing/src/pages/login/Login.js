import React, { useState, useEffect, useContext } from 'react';
import './Login.css';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../AuthContext';

function Login({ onSubmit }) {
    const navigate = useNavigate();
    const { token, signIn } = useContext(AuthContext);
    const [isSignUp, setIsSignUp] = useState(false);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [isEmailValid, setIsEmailValid] = useState(null);
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const [serverMessage, setServerMessage] = useState(null);

    const validateEmail = (email) => {
        // Basic, practical email regex (case-insensitive)
        const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
        return emailRegex.test(String(email || ''));
    };

    const resetMessages = () => {
        setServerMessage(null);
        setErrors({});
    };

    const handleEmailChange = (value) => {
        setEmail(value);
        // Only perform live validation in Sign Up mode
        if (!isSignUp) return;

        // Live-validate on every change and show visual hint
        if (!value || !value.trim()) {
            setIsEmailValid(null);
        } else {
            const ok = validateEmail(value);
            setIsEmailValid(ok);
            // If it was previously an error and now valid, clear the error
            if (errors.email && ok) {
                setErrors((prev) => {
                    const { email: _e, ...rest } = prev;
                    return rest;
                });
            }
        }
    };

    const handleEmailBlur = () => {
        // Only validate on blur in Sign Up mode
        if (!isSignUp) return;

        // Validate on blur to avoid noisy inline errors while typing
        if (!email.trim()) {
            setIsEmailValid(false);
            setErrors((prev) => ({ ...prev, email: 'Email is required' }));
        } else if (!validateEmail(email)) {
            setIsEmailValid(false);
            setErrors((prev) => ({ ...prev, email: 'Please enter a valid email' }));
        } else {
            setIsEmailValid(true);
            setErrors((prev) => {
                const { email: _e, ...rest } = prev;
                return rest;
            });
        }
    };

    // Google client id (provided)
    const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '706234058502-c2dk7t2rr4aod9mf5jg8essau207cnrs.apps.googleusercontent.com';

    useEffect(() => {
        // If already logged in, redirect to profile
        if (token) {
            navigate('/profile');
            return;
        }

        // Render Google button if the library is available
        const tryRender = () => {
            if (window.google && window.google.accounts && window.google.accounts.id) {
                window.google.accounts.id.initialize({
                    client_id: GOOGLE_CLIENT_ID,
                    callback: async (response) => {
                        // response.credential is the ID token
                        const idToken = response?.credential;
                        if (!idToken) return;
                        setServerMessage('Signing in with Google...');
                        try {
                            const res = await fetch('/api/auth/google', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                credentials: 'include',
                                body: JSON.stringify({ id_token: idToken })
                            });
                            const body = await res.json();
                            if (res.ok && body.token) {
                                try { signIn(body.token); } catch(_) { try { localStorage.setItem('authToken', body.token); } catch(_){} }
                                navigate('/profile');
                            } else {
                                setServerMessage(body.error || 'Google sign-in failed');
                            }
                        } catch (err) {
                            console.error('Google sign-in error', err);
                            setServerMessage('Google sign-in error');
                        }
                    }
                });

                // Render the button into the container if present
                const container = document.getElementById('g_id_signin');
                if (container) {
                    window.google.accounts.id.renderButton(container, { theme: 'outline', size: 'large' });
                }
            }
        };

        // Try rendering shortly after mount (script is async)
        const id = setTimeout(tryRender, 500);
        return () => clearTimeout(id);
    }, [GOOGLE_CLIENT_ID, navigate, signIn, token]);

    // Derived password rule booleans for live UI feedback
    const pass = String(password || '');
    const passMin = pass.length >= 8;
    const passUpper = /[A-Z]/.test(pass);
    const passDigit = /\d/.test(pass);

    const handleSubmit = async (e) => {
        e.preventDefault();
        resetMessages();
        const newErrors = {};

        // Validation
        if (isSignUp && !username.trim()) {
            newErrors.username = 'Username is required';
        }

        if (!email.trim()) {
            newErrors.email = 'Email is required';
        } else if (isSignUp && !validateEmail(email)) {
            // Only enforce format validation on Sign Up
            newErrors.email = 'Please enter a valid email';
        }

        if (!pass.trim()) {
            newErrors.password = 'Password is required';
        } else if (!passMin || !passUpper || !passDigit) {
            newErrors.password = 'Password must be at least 8 characters, include an uppercase letter and a digit';
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) return;

        if (isSignUp) {
            // Call register endpoint
            try {
                const res = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ username, email, password })
                });
                const body = await res.json();
                if (res.status === 201) {
                    setServerMessage('Account created — signing you in...');
                    // Auto-login if onSubmit is provided
                    if (onSubmit) {
                        await onSubmit({ email, password });
                    }
                } else {
                    setServerMessage(body.error || 'Signup failed');
                }
            } catch (err) {
                console.error('Signup error', err);
                setServerMessage('Signup error');
            }
        } else {
            // Login: delegate to onSubmit (App provides it)
            if (onSubmit) {
                await onSubmit({ email, password });
            }
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h1>{isSignUp ? 'Sign Up' : 'Login'}</h1>
                <form onSubmit={handleSubmit} aria-label="form">
                    {isSignUp && (
                        <div className="form-group">
                            <label htmlFor="username">Username</label>
                            <input
                                type="text"
                                id="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className={errors.username ? 'error' : ''}
                            />
                            {errors.username && <span className="error-message">{errors.username}</span>}
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => handleEmailChange(e.target.value)}
                                onBlur={handleEmailBlur}
                                className={errors.email ? 'error' : (isEmailValid === true ? 'valid' : (isEmailValid === false ? 'invalid' : ''))}
                                style={{ flex: 1 }}
                            />
                            <span aria-live="polite" style={{ minWidth: 20, textAlign: 'center', color: isEmailValid ? 'green' : 'crimson' }}>
                                {isEmailValid === null ? '' : (isEmailValid ? '✓' : '✖')}
                            </span>
                        </div>
                        {errors.email && <span className="error-message">{errors.email}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={errors.password ? 'error' : ''}
                                style={{ flex: 1 }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((s) => !s)}
                                aria-pressed={showPassword}
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                                style={{
                                    padding: '6px 10px',
                                    borderRadius: 4,
                                    border: '1px solid #ccc',
                                    background: '#fff',
                                    cursor: 'pointer'
                                }}
                            >
                                {showPassword ? 'Hide' : 'Show'}
                            </button>
                        </div>
                        {errors.password && <span className="error-message">{errors.password}</span>}

                        {/* Show password rules on signup tab */}
                        {isSignUp && (
                            <ul style={{ marginTop: 8, marginLeft: 18, paddingLeft: 0 }}>
                                <li style={{ color: passMin ? 'green' : '#b00' }}>At least 8 characters</li>
                                <li style={{ color: passUpper ? 'green' : '#b00' }}>At least one uppercase letter</li>
                                <li style={{ color: passDigit ? 'green' : '#b00' }}>At least one digit</li>
                            </ul>
                        )}
                    </div>

                    <button type="submit" className="login-button">
                        {isSignUp ? 'Sign Up' : 'Login'}
                    </button>

                    <div style={{ marginTop: '12px' }}>
                        <button
                            type="button"
                            className="link-button"
                            onClick={() => { resetMessages(); setIsEmailValid(null); setIsSignUp(!isSignUp); }}
                        >
                            {isSignUp ? 'Have an account? Login' : "Don't have an account? Sign up"}
                        </button>
                    </div>

                    {serverMessage && <div className="server-message">{serverMessage}</div>}
                </form>

                <div style={{ marginTop: 12 }}>
                    <div id="g_id_signin"></div>
                </div>
            </div>
        </div>
    );
}

export default Login;