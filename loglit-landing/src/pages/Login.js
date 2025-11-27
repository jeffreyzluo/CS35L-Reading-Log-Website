import React, { useState, useEffect } from 'react';
import './Login.css';

function Login({ onSubmit }) {
    const [isSignUp, setIsSignUp] = useState(false);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState({});
    const [serverMessage, setServerMessage] = useState(null);

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const resetMessages = () => {
        setServerMessage(null);
        setErrors({});
    };

    // Google client id (provided)
    const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '706234058502-c2dk7t2rr4aod9mf5jg8essau207cnrs.apps.googleusercontent.com';

    useEffect(() => {
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
                                // Save token and navigate to profile
                                try { localStorage.setItem('authToken', body.token); } catch (_) {}
                                window.location.href = '/profile';
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
    }, [GOOGLE_CLIENT_ID]);

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
        } else if (!validateEmail(email)) {
            newErrors.email = 'Please enter a valid email';
        }

        if (!password.trim()) {
            newErrors.password = 'Password is required';
        } else if (password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
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
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={errors.email ? 'error' : ''}
                        />
                        {errors.email && <span className="error-message">{errors.email}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={errors.password ? 'error' : ''}
                        />
                        {errors.password && <span className="error-message">{errors.password}</span>}
                    </div>

                    <button type="submit" className="login-button">
                        {isSignUp ? 'Sign Up' : 'Login'}
                    </button>

                    <div style={{ marginTop: '12px' }}>
                        <button
                            type="button"
                            className="link-button"
                            onClick={() => { resetMessages(); setIsSignUp(!isSignUp); }}
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