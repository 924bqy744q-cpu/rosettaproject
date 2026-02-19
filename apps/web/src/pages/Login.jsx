import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/Button';
import Input from '../components/Input';
import { Sparkles, ArrowRight } from 'lucide-react';

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
        <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center -mb-2">
                    <div className="bg-emerald-500/20 p-3 rounded-full border border-emerald-500/30">
                        <Sparkles className="w-8 h-8 text-emerald-400" />
                    </div>
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight">
                    Rosetta
                </h2>
                <p className="mt-2 text-center text-sm text-slate-400">
                    Your personalized concept translation engine.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-slate-800/50 py-8 px-4 shadow-xl border border-slate-700 sm:rounded-xl sm:px-10 backdrop-blur-sm">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-slate-300">
                                Email address to continue
                            </label>
                            <div className="mt-2">
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    placeholder="archimedes@syracuse.edu"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="text-red-400 text-sm mt-2">
                                {error}
                            </div>
                        )}

                        <div>
                            <Button
                                type="submit"
                                variant="primary"
                                isLoading={loading}
                                className="w-full flex justify-center py-2.5"
                            >
                                Enter Rosetta <ArrowRight className="ml-2 w-4 h-4" />
                            </Button>
                        </div>
                    </form>
                </div>
                <p className="mt-6 text-center text-xs text-slate-500">
                    Phase 2 Sandbox. No password required for entry.
                </p>
            </div>
        </div>
    );
};

export default Login;
