import React, { useState, useEffect, useContext } from 'react';
import './Login.css';
// GENAI_PROMPT: Create basic Homepage and Login component
// - Context: The project needs a minimal, accessible Homepage and a simplified Login component
//   that integrates with existing `AuthContext` and routing. Keep styles minimal and reusable.
// - Deliverable: Two React components (Homepage, Login) with simple markup, form state management,
//   basic validation, and clear CSS class names. Provide short usage notes and any required route
//   additions for `react-router-dom`.
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../AuthContext';
import api from '../../services/api';

/**
 * Login component
 * - Supports sign-in and sign-up flows
 * - Optionally calls `onSubmit` (provided by parent) for login
 */
function Login({ onSubmit }) {
    const navigate = useNavigate();
    const { token, signIn } = useContext(AuthContext);

    // UI mode: false => Login, true => Sign Up
    const [isSigningUp, setIsSigningUp] = useState(false);

    // Form fields
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [isEmailValid, setIsEmailValid] = useState(null);
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Validation/errors and server feedback
    const [errors, setErrors] = useState({});
    const [serverMessage, setServerMessage] = useState(null);

    // Basic, practical email regex (case-insensitive)
    const validateEmail = (value) => {
        const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
        return emailRegex.test(String(value || ''));
    };

    const resetMessages = () => {
        setServerMessage(null);
        setErrors({});
    };

    const handleEmailChange = (value) => {
        setEmail(value);
        // Only perform live validation in Sign Up mode
        if (!isSigningUp) return;

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
        if (!isSigningUp) return;

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

    // Google client id (from frontend env). Create React App exposes vars prefixed with REACT_APP_
    const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

    

    useEffect(() => {
        // If already logged in, redirect to profile
        if (token) {
            navigate('/profile');
            return;
        }

        // Helper inside effect so it doesn't need to be a hook dependency
        const storeTokenSafely = (token) => {
            try { signIn(token); } catch (_) { try { localStorage.setItem('authToken', token); } catch (_) {} }
        };

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
                            const body = await api.auth.google(idToken);
                            if (body && body.token) {
                                storeTokenSafely(body.token);
                                navigate('/profile');
                            } else {
                                setServerMessage((body && body.error) || 'Google sign-in failed');
                            }
                        } catch (err) {
                                setServerMessage(err.message || 'Google sign-in error');
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
    // Derived password rule booleans for live UI feedback
    const passwordValue = String(password || '');
    const passwordMinOk = passwordValue.length >= 8;
    const passwordHasUpper = /[A-Z]/.test(passwordValue);
    const passwordHasDigit = /\d/.test(passwordValue);

    const handleSubmit = async (e) => {
        e.preventDefault();
        resetMessages();
        const newErrors = {};

        // Validation
        if (isSigningUp && !username.trim()) {
            newErrors.username = 'Username is required';
        }

        if (!email.trim()) {
            newErrors.email = 'Email is required';
        } else if (isSigningUp && !validateEmail(email)) {
            // Only enforce format validation on Sign Up
            newErrors.email = 'Please enter a valid email';
        }

        if (!passwordValue.trim()) {
            newErrors.password = 'Password is required';
        } else if (!passwordMinOk || !passwordHasUpper || !passwordHasDigit) {
            newErrors.password = 'Password must be at least 8 characters, include an uppercase letter and a digit';
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) return;

        if (isSigningUp) {
            // Call register endpoint via service
            try {
                await api.auth.register(username, email, password);
                setServerMessage('Account created — signing you in...');
                // Auto-login if onSubmit is provided
                if (onSubmit) {
                    await onSubmit({ email, password });
                }
            } catch (err) {
                setServerMessage(err.message || 'Signup error');
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
                <h1>{isSigningUp ? 'Sign Up' : 'Login'}</h1>
                <form onSubmit={handleSubmit} aria-label="form">
                    {isSigningUp && (
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
                        {isSigningUp && (
                            <ul style={{ marginTop: 8, marginLeft: 18, paddingLeft: 0 }}>
                                <li style={{ color: passwordMinOk ? 'green' : '#b00' }}>At least 8 characters</li>
                                <li style={{ color: passwordHasUpper ? 'green' : '#b00' }}>At least one uppercase letter</li>
                                <li style={{ color: passwordHasDigit ? 'green' : '#b00' }}>At least one digit</li>
                            </ul>
                        )}
                    </div>

                    <button type="submit" className="login-button">
                        {isSigningUp ? 'Sign Up' : 'Login'}
                    </button>

                    <div style={{ marginTop: '12px' }}>
                        <button
                            type="button"
                            className="link-button"
                            onClick={() => { resetMessages(); setIsEmailValid(null); setIsSigningUp(!isSigningUp); }}
                        >
                            {isSigningUp ? 'Have an account? Login' : "Don't have an account? Sign up"}
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