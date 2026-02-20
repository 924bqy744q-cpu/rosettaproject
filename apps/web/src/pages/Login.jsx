import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/Button';
import Input from '../components/Input';
import './Login.css';

const Login = () => {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email) return;

        setLoading(true);
        setError('');

        const success = await login(email);

        if (!success) {
            setError('Failed to log in. Please try again.');
        }

        setLoading(false);
    };

    return (
        <div className="container login-container">
            <main className="login-main fade-in">
                <div className="login-header">
                    <div className="login-logo">
                        <span className="rosetta-brand">ROSETTA</span>
                    </div>
                    <h1>Your personalized concept translation engine.</h1>
                    <p className="login-subtitle">Enter your email to continue learning.</p>
                </div>

                <div className="login-card">
                    <form onSubmit={handleSubmit} className="login-form">
                        <Input
                            type="email"
                            placeholder="e.g. archimedes@syracuse.edu"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoFocus
                        />

                        {error && (
                            <div className="login-error">
                                {error}
                            </div>
                        )}

                        <div className="login-action">
                            <Button
                                onClick={handleSubmit}
                                disabled={!email || loading}
                            >
                                {loading ? 'Entering...' : 'Enter Rosetta →'}
                            </Button>
                        </div>
                    </form>
                </div>

                <div className="login-footer">
                    <p>Phase 2 Sandbox. No password required.</p>
                </div>
            </main>
        </div>
    );
};

export default Login;
