import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import './Dashboard.css';

const API_Base = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export default function Dashboard({ onStartSession }) {
    const { user, token, logout } = useAuth();
    const [journeys, setJourneys] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [expandedSession, setExpandedSession] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const headers = { 'Authorization': `Bearer ${token}` };

                const [journeyRes, sessionRes] = await Promise.all([
                    fetch(`${API_Base}/user/journeys`, { headers }),
                    fetch(`${API_Base}/user/sessions`, { headers })
                ]);

                if (journeyRes.ok) {
                    const jData = await journeyRes.json();
                    setJourneys(jData.journeys || []);
                }

                if (sessionRes.ok) {
                    const sData = await sessionRes.json();
                    setSessions(sData.sessions || []);
                }
            } catch (err) {
                console.error('Failed to load dashboard data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [token]);

    const getScore = (session) => {
        if (session.transferTest?.score) return session.transferTest.score;
        return null;
    };

    const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    if (loading) {
        return (
            <div className="container">
                <div className="dashboard">
                    <div className="empty-state">
                        <p>Loading your profile...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <div className="dashboard">
                {/* Header */}
                <div className="dashboard-header">
                    <h1>Rosetta</h1>
                    <div className="dashboard-header-actions">
                        <button className="btn-new-session" onClick={onStartSession}>
                            Learn something new →
                        </button>
                        <button className="btn-logout" onClick={logout}>
                            Log out
                        </button>
                    </div>
                </div>

                {/* Profile Card */}
                <div className="profile-card">
                    <div className="profile-card-label">Your cognitive profile</div>
                    <div className="profile-card-email">{user?.email}</div>

                    {user?.fingerprint ? (
                        <>
                            <div className="profile-domains">
                                {user.fingerprint.dominantDomains?.map((d, i) => (
                                    <span key={i} className="domain-tag">{d}</span>
                                ))}
                                {user.fingerprint.reasoningStyle && (
                                    <span className="reasoning-badge">{user.fingerprint.reasoningStyle}</span>
                                )}
                            </div>
                        </>
                    ) : (
                        <p style={{ color: 'var(--ink-soft)', fontSize: '0.85rem' }}>
                            Complete your first session to build your cognitive profile.
                        </p>
                    )}
                </div>

                {/* Domain Journeys */}
                {journeys.length > 0 && (
                    <>
                        <div className="section-header">Your Learning Domains</div>
                        <div className="journeys-grid">
                            {journeys.map((j) => (
                                <div key={j.id} className="journey-card">
                                    <div className="journey-domain">{j.domain}</div>
                                    <div className="journey-count">
                                        {j.sessionCount} session{j.sessionCount !== 1 ? 's' : ''}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* Session History */}
                <div className="section-header">Session History</div>
                {sessions.length === 0 ? (
                    <div className="empty-state">
                        <h3>No sessions yet</h3>
                        <p>Start your first session to see your learning history here.</p>
                        <button className="btn-new-session" onClick={onStartSession}>
                            Get started →
                        </button>
                    </div>
                ) : (
                    <div className="session-list">
                        {sessions.map((s) => {
                            const score = getScore(s);
                            const isExpanded = expandedSession === s.id;
                            return (
                                <div key={s.id}>
                                    <div
                                        className="session-row"
                                        onClick={() => setExpandedSession(isExpanded ? null : s.id)}
                                    >
                                        <div className="session-row-left">
                                            <span className="session-concept">{s.concept}</span>
                                            <div className="session-meta">
                                                <span>{formatDate(s.createdAt)}</span>
                                                {s.subsumerUsed && <span>via {s.subsumerUsed}</span>}
                                            </div>
                                        </div>
                                        <span className={`score-badge ${score || 'pending'}`}>
                                            {score ? score.replace('_', ' ') : 'in progress'}
                                        </span>
                                    </div>

                                    {/* Expanded Detail */}
                                    {isExpanded && s.explanation && (
                                        <div className="session-detail">
                                            <div className="session-detail-chunks">
                                                {(s.explanation.chunks || []).map((chunk, i) => (
                                                    <div key={i} className="session-detail-chunk">
                                                        <div className="session-detail-label">
                                                            {chunk.title || `Chunk ${chunk.chunk_number}`}
                                                        </div>
                                                        <p>{chunk.content}</p>
                                                    </div>
                                                ))}
                                            </div>
                                            {s.explanation.native_domain_restatement && (
                                                <div className="session-detail-chunk" style={{ marginTop: 'var(--space-4)' }}>
                                                    <div className="session-detail-label">Native Domain</div>
                                                    <p>{s.explanation.native_domain_restatement}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
