import { useState, useCallback } from 'react';
import posthog from 'posthog-js';
import { useAuth } from './useAuth';

const API_Base = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const useSession = () => {
    const { token } = useAuth();
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const startSession = useCallback(async (concept) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_Base}/session/start`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ concept })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error?.message || 'Failed to start session');

            setSession(prev => ({ ...prev, ...data }));
            posthog.capture('session_started', {
                session_id: data.session_id,
                concept: concept
            });
            return data;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const submitFingerprint = useCallback(async (sessionId, answers) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_Base}/session/fingerprint`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ session_id: sessionId, answers })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error?.message || 'Failed to submit fingerprint');

            setSession(prev => ({ ...prev, ...data }));
            return data;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const generateExplanation = useCallback(async (sessionId, state) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_Base}/session/explain`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ session_id: sessionId, state })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error?.message || 'Failed to generate explanation');

            setSession(prev => ({ ...prev, ...data }));
            return data;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const evaluateTest = useCallback(async (sessionId, userResponse) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_Base}/session/evaluate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ session_id: sessionId, user_response: userResponse, clicked: true })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error?.message || 'Failed to evaluate test');

            setSession(prev => ({ ...prev, result: data }));
            posthog.capture('transferTest_submitted', {
                session_id: sessionId,
                score: data.score
            });
            if (data.score === 'integrated') {
                posthog.capture('session_completed', {
                    session_id: sessionId,
                    success: true
                });
            }
            return data;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const retryExplanation = useCallback(async (sessionId, attemptNumber) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_Base}/session/retry`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ session_id: sessionId, attempt_number: attemptNumber })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error?.message || 'Failed to retry explanation');

            // overwrite key parts of session with new explanation
            setSession(prev => ({
                ...prev,
                ...data,
                result: null // reset result since we are retrying
            }));
            return data;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        session,
        loading,
        error,
        startSession,
        submitFingerprint,
        generateExplanation,
        evaluateTest,
        retryExplanation
    };
};
