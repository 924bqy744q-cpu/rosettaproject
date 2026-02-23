import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import './Dashboard.css';

const API_Base = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export default function Dashboard({ onStartSession }) {
    const { user, token, logout } = useAuth();
    const [journeys, setJourneys] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [dueReviews, setDueReviews] = useState([]);
    const [bridges, setBridges] = useState([]);
    const [expandedConcept, setExpandedConcept] = useState(null);
    const [expandedSession, setExpandedSession] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const headers = { 'Authorization': `Bearer ${token}` };

                const [journeyRes, sessionRes, dueRes, bridgeRes] = await Promise.all([
                    fetch(`${API_Base}/user/journeys`, { headers }),
                    fetch(`${API_Base}/user/sessions`, { headers }),
                    fetch(`${API_Base}/user/retrievals/due`, { headers }),
                    fetch(`${API_Base}/user/bridges`, { headers })
                ]);

                if (journeyRes.ok) {
                    const jData = await journeyRes.json();
                    setJourneys(jData.journeys || []);
                }

                if (sessionRes.ok) {
                    const sData = await sessionRes.json();
                    setSessions(sData.sessions || []);
                }

                if (dueRes.ok) {
                    const dData = await dueRes.json();
                    setDueReviews(dData.due || []);
                }

                if (bridgeRes.ok) {
                    const bData = await bridgeRes.json();
                    setBridges(bData.bridges || []);
                }
            } catch (err) {
                console.error('Failed to load dashboard data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [token]);

    // Group sessions by concept (case-insensitive)
    const groupedSessions = useMemo(() => {
        const groups = {};
        sessions.forEach(s => {
            const key = (s.concept || '').trim().toLowerCase();
            if (!groups[key]) {
                groups[key] = { concept: s.concept, sessions: [] };
            }
            groups[key].sessions.push(s);
        });
        // Sort groups by most recent session
        return Object.values(groups).sort((a, b) =>
            new Date(b.sessions[0].createdAt) - new Date(a.sessions[0].createdAt)
        );
    }, [sessions]);

    // Deduplicate domain tags
    const uniqueDomains = useMemo(() => {
        if (!user?.fingerprint?.dominantDomains) return [];
        return [...new Set(user.fingerprint.dominantDomains)];
    }, [user]);

    const getScore = (session) => {
        if (session.transferTest?.score) return session.transferTest.score;
        return null;
    };

    const getBestScore = (sessions) => {
        const scores = sessions.map(s => getScore(s)).filter(Boolean);
        if (scores.includes('integrated')) return 'integrated';
        if (scores.includes('surface')) return 'surface';
        if (scores.includes('not_yet')) return 'not_yet';
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
                                {uniqueDomains.map((d, i) => (
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

                {/* Due for Review — Spaced Repetition */}
                {dueReviews.length > 0 && (
                    <>
                        <div className="section-header">Due for Review</div>
                        <div className="journeys-grid">
                            {dueReviews.map((r) => (
                                <div key={r.id} className="journey-card" style={{ borderColor: 'var(--accent)', cursor: 'pointer' }}
                                    onClick={() => onStartSession(r.concept)}>
                                    <div className="journey-domain">{r.concept}</div>
                                    <div className="journey-count">{r.domain} · review #{r.repetitions + 1}</div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* Cross-Domain Insights */}
                {bridges.length > 0 && (
                    <>
                        <div className="section-header">Cross-Domain Insights</div>
                        <div className="session-list">
                            {bridges.map((b) => (
                                <div key={b.id} className="session-row" style={{ cursor: 'default' }}>
                                    <div className="session-row-left">
                                        <span className="session-concept">
                                            {b.source.concept} ↔ {b.target.concept}
                                        </span>
                                        <div className="session-meta">
                                            <span>Shared pattern: {b.sharedPattern}</span>
                                            <span>{Math.round(b.confidence * 100)}% match</span>
                                        </div>
                                    </div>
                                    <span className="score-badge integrated">bridge</span>
                                </div>
                            ))}
                        </div>
                    </>
                )}

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

                {/* Session History — grouped by concept */}
                <div className="section-header">Learning Paths</div>
                {groupedSessions.length === 0 ? (
                    <div className="empty-state">
                        <h3>No sessions yet</h3>
                        <p>Start your first session to see your learning history here.</p>
                        <button className="btn-new-session" onClick={onStartSession}>
                            Get started →
                        </button>
                    </div>
                ) : (
                    <div className="session-list">
                        {groupedSessions.map((group) => {
                            const bestScore = getBestScore(group.sessions);
                            const isGroupExpanded = expandedConcept === group.concept.toLowerCase();
                            const latestSession = group.sessions[0];

                            return (
                                <div key={group.concept.toLowerCase()}>
                                    {/* Group Header Row */}
                                    <div
                                        className="session-row"
                                        onClick={() => setExpandedConcept(isGroupExpanded ? null : group.concept.toLowerCase())}
                                    >
                                        <div className="session-row-left">
                                            <span className="session-concept">{group.concept}</span>
                                            <div className="session-meta">
                                                <span>{group.sessions.length} attempt{group.sessions.length !== 1 ? 's' : ''}</span>
                                                <span>Latest: {formatDate(latestSession.createdAt)}</span>
                                                {latestSession.subsumerUsed && <span>via {latestSession.subsumerUsed}</span>}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                            <span className={`score-badge ${bestScore || 'pending'}`}>
                                                {bestScore ? bestScore.replace('_', ' ') : 'in progress'}
                                            </span>
                                            <span style={{ color: 'var(--ink-soft)', fontSize: '0.8rem' }}>
                                                {isGroupExpanded ? '▲' : '▼'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Expanded: individual attempts */}
                                    {isGroupExpanded && (
                                        <div className="session-detail" style={{ padding: 'var(--space-3)' }}>
                                            {group.sessions.map((s, i) => {
                                                const score = getScore(s);
                                                const isAttemptExpanded = expandedSession === s.id;
                                                return (
                                                    <div key={s.id} style={{ marginBottom: 'var(--space-2)' }}>
                                                        <div
                                                            className="session-row"
                                                            style={{ background: 'var(--surface)', border: '1px solid var(--surface-3)' }}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setExpandedSession(isAttemptExpanded ? null : s.id);
                                                            }}
                                                        >
                                                            <div className="session-row-left">
                                                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--ink-mid)' }}>
                                                                    Attempt {group.sessions.length - i}
                                                                </span>
                                                                <div className="session-meta">
                                                                    <span>{formatDate(s.createdAt)}</span>
                                                                    {s.subsumerUsed && <span>via {s.subsumerUsed}</span>}
                                                                </div>
                                                            </div>
                                                            <span className={`score-badge ${score || 'pending'}`}>
                                                                {score ? score.replace('_', ' ') : 'in progress'}
                                                            </span>
                                                        </div>

                                                        {/* Expanded attempt detail */}
                                                        {isAttemptExpanded && s.explanation && (
                                                            <div className="session-detail" style={{ marginTop: 'var(--space-2)', marginLeft: 'var(--space-4)' }}>
                                                                <div className="session-detail-chunks">
                                                                    {(s.explanation.chunks || []).map((chunk, ci) => (
                                                                        <div key={ci} className="session-detail-chunk">
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
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}



