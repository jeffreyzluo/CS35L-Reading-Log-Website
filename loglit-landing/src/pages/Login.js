import React, { useState } from 'react';
import './Login.css';

function Login({ onSubmit }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState({});

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const newErrors = {};

        // Validation
        if (!email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!validateEmail(email)) {
            newErrors.email = 'Please enter a valid email';
        }

        if (!password.trim()) {
            newErrors.password = 'Password is required';
        }

        setErrors(newErrors);

        // If no errors, call onSubmit callback
        if (Object.keys(newErrors).length === 0 && onSubmit) {
            onSubmit({ email, password });
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h1>Login</h1>
                <form onSubmit={handleSubmit} aria-label="form">
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
                        Login
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Login;