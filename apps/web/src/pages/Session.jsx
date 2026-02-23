import React, { useState, useEffect } from 'react';
import { useSession } from '../hooks/useSession';
import Button from '../components/Button';
import Input from '../components/Input';
import ChatBubble from '../components/ChatBubble';
import TypingIndicator from '../components/TypingIndicator';
import SegmentedControl from '../components/SegmentedControl';
import ProgressDots from '../components/ProgressDots';
import LoadingState from '../components/LoadingState';
import ExplanationChunk from '../components/ExplanationChunk';
import ResultCard from '../components/ResultCard';

const STEPS = {
    CONCEPT_INPUT: 0,
    FINGERPRINT_CHAT: 1,
    STATE_CAPTURE: 2,
    LOADING: 3,
    EXPLANATION: 4,
    TRANSFER_TEST: 5,
    RESULT: 6
};

const Session = ({ onBack }) => {
    const {
        session,
        loading,
        startSession,
        submitFingerprint,
        generateExplanation,
        evaluateTest,
        retryExplanation
    } = useSession();

    const [step, setStep] = useState(STEPS.CONCEPT_INPUT);
    const [inputs, setInputs] = useState({}); // store form inputs

    // --- Step 1: Concept Input ---
    const handleConceptSubmit = async () => {
        if (!inputs.concept) return;
        const result = await startSession(inputs.concept);

        // Return-user flow: skip fingerprint if user already has one
        if (result?.skip_fingerprint) {
            setStep(STEPS.STATE_CAPTURE);
        } else {
            setStep(STEPS.FINGERPRINT_CHAT);
        }
    };

    // --- Step 2: Fingerprint Chat ---
    const [chatHistory, setChatHistory] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

    useEffect(() => {
        if (session?.fingerprint_questions && step === STEPS.FINGERPRINT_CHAT) {
            if (currentQuestionIndex < session.fingerprint_questions.length) {
                // Add system message
                const question = session.fingerprint_questions[currentQuestionIndex];
                // Only add if not already added
                // Using logic to simulate chat flow
            }
        }
    }, [session, step, currentQuestionIndex]);

    const handleFingerprintSubmit = async () => {
        if (!inputs.fingerprintAnswer) return;

        // Simple flow: collect one answer for now to keep it simple as per POC
        // A real chat would be more complex
        await submitFingerprint(session.session_id, { q1: inputs.fingerprintAnswer });
        setStep(STEPS.STATE_CAPTURE);
    };

    // --- Step 3: State Capture ---
    const handleStateSubmit = async () => {
        if (!inputs.urgency || !inputs.frustration) return;

        // Trigger API call but move to LOADING immediately
        setStep(STEPS.LOADING);

        await generateExplanation(session.session_id, {
            urgency: inputs.urgency,
            frustration_level: inputs.frustration
        });

        // When data comes back (implied by await completion), move to EXPLANATION
        // But we want a min wait time 3-5s as per design guide
        // Loading component might handle visual, but logic helps.
        // Let's rely on LoadingState component logic or artificial delay here
        // We already awaited, so just move next.
        setStep(STEPS.EXPLANATION);
    };

    // --- Step 5: Explanation ---
    // Managed by ExplanationChunk components mostly

    // --- Step 6: Transfer Test ---
    const handleTestSubmit = async () => {
        if (!inputs.testAnswer) return;
        await evaluateTest(session.session_id, inputs.testAnswer);
        setStep(STEPS.RESULT);
    };

    const handleRetry = async () => {
        setStep(STEPS.LOADING);
        await retryExplanation(session.session_id, (session.result?.attempt_number || 1) + 1);
        setStep(STEPS.EXPLANATION);
    }

    const handleReset = () => {
        if (onBack) {
            onBack(); // go back to Dashboard
        } else {
            window.location.reload();
        }
    };

    // RENDER LOGIC
    return (
        <div className="container">
            {/* Header / Progress - verify if needed on all screens? Guide says "No navigation bar" but shows progress dots */}
            {step > STEPS.CONCEPT_INPUT && step < STEPS.RESULT && (
                <div style={{ padding: '20px 0', display: 'flex', justifyContent: 'center', position: 'relative' }}>
                    {onBack && step === STEPS.CONCEPT_INPUT && (
                        <button
                            onClick={onBack}
                            style={{ position: 'absolute', left: 0, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-soft)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}
                        >
                            ← Dashboard
                        </button>
                    )}
                    <ProgressDots currentStep={step} />
                </div>
            )}

            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>

                {/* 0. CONCEPT INPUT */}
                {step === STEPS.CONCEPT_INPUT && (
                    <div className="fade-in">
                        <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)', letterSpacing: '0.1em', fontSize: '0.7rem', marginBottom: '1.5rem' }}>ROSETTA</div>
                        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>What is hard<br />to understand?</h1>
                        <p style={{ color: 'var(--ink-soft)', marginBottom: '2rem' }}>Any concept, any domain. We rebuild it for you.</p>

                        <Input
                            placeholder="e.g. Entropy, Closure, monads..."
                            value={inputs.concept || ''}
                            onChange={(e) => setInputs({ ...inputs, concept: e.target.value })}
                            autoFocus
                        />
                        <div style={{ marginTop: '1.5rem' }}>
                            <Button onClick={handleConceptSubmit} disabled={!inputs.concept || loading}>
                                {loading ? 'Starting...' : 'Continue →'}
                            </Button>
                        </div>
                    </div>
                )}

                {/* 1. FINGERPRINT (simplified for now) */}
                {step === STEPS.FINGERPRINT_CHAT && (
                    <div className="fade-in" style={{ width: '100%' }}>
                        <ChatBubble message={session?.fingerprint_questions?.[0] || "What are you genuinely good at?"} />
                        {/* Simulate user typing or just input at bottom */}
                        <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
                            <Input
                                placeholder="e.g. I play guitar..."
                                value={inputs.fingerprintAnswer || ''}
                                onChange={(e) => setInputs({ ...inputs, fingerprintAnswer: e.target.value })}
                            />
                            <div style={{ marginTop: '1rem' }}>
                                <Button onClick={handleFingerprintSubmit} disabled={!inputs.fingerprintAnswer || loading}>
                                    Reply
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. STATE CAPTURE */}
                {step === STEPS.STATE_CAPTURE && (
                    <div className="fade-in">
                        <h2>Two quick questions.</h2>
                        <div style={{ marginTop: '2rem' }}>
                            <p style={{ fontSize: '0.9rem', fontWeight: 500, marginBottom: '0.5rem' }}>How frustrated are you?</p>
                            <SegmentedControl
                                options={[
                                    { label: 'A little', value: 1 },
                                    { label: 'Somewhat', value: 3 },
                                    { label: 'Very', value: 5 }
                                ]}
                                value={inputs.frustration}
                                onChange={(v) => setInputs({ ...inputs, frustration: v })}
                            />
                        </div>
                        <div style={{ marginTop: '1.5rem', marginBottom: '2rem' }}>
                            <p style={{ fontSize: '0.9rem', fontWeight: 500, marginBottom: '0.5rem' }}>How urgent is this?</p>
                            <SegmentedControl
                                options={[
                                    { label: 'Curious', value: 1 },
                                    { label: 'Need it soon', value: 3 },
                                    { label: 'Right now', value: 5 }
                                ]}
                                value={inputs.urgency}
                                onChange={(v) => setInputs({ ...inputs, urgency: v })}
                            />
                        </div>
                        <Button onClick={handleStateSubmit} disabled={!inputs.frustration || !inputs.urgency}>
                            Build Explanation →
                        </Button>
                    </div>
                )}

                {/* 3. LOADING */}
                {step === STEPS.LOADING && (
                    <LoadingState subsumer={session?.subsumer_used} />
                )}

                {/* 4. EXPLANATION */}
                {step === STEPS.EXPLANATION && session && (
                    <div className="fade-in">
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--ink-soft)', marginBottom: '1rem' }}>
                            {session.subsumer_used ? `${session.subsumer_used.toUpperCase()} METHOD` : 'ANALOGY'}
                        </div>

                        {session?.chunks?.map((chunk, i) => (
                            <ExplanationChunk
                                key={i}
                                chunkNumber={chunk.chunk_number}
                                text={chunk.content}
                                totalChunks={session.chunks.length}
                                delay={i * 3000} // Staggered reveal
                            />
                        ))}

                        <div style={{ marginTop: '2rem', padding: '1rem', background: 'var(--surface-2)', borderRadius: '8px', fontSize: '0.9rem' }}>
                            <strong>Native Domain:</strong> {session.native_domain_restatement}
                        </div>

                        <div style={{ marginTop: '2rem' }}>
                            <Button onClick={() => setStep(STEPS.TRANSFER_TEST)}>
                                Test Understanding →
                            </Button>
                        </div>
                    </div>
                )}

                {/* 5. TRANSFER TEST */}
                {step === STEPS.TRANSFER_TEST && session && (
                    <div className="fade-in">
                        <h2>Transfer Test</h2>
                        <p style={{ fontSize: '1.1rem', lineHeight: 1.4, margin: '1rem 0 2rem 0' }}>
                            {session?.transfer_test?.scenario}
                        </p>

                        <p style={{ fontWeight: 500, marginBottom: '0.5rem' }}>{session?.transfer_test?.question}</p>

                        <Input
                            type="textarea" // Not implemented in component yet but Input handles standard input. Need textarea support in Input? 
                            // Input component used "input-field" class on <input>. I probably need to update Input.jsx to support 'textarea'
                            placeholder="Your answer..."
                            value={inputs.testAnswer || ''}
                            onChange={(e) => setInputs({ ...inputs, testAnswer: e.target.value })}
                        />
                        <div style={{ marginTop: '1.5rem' }}>
                            <Button onClick={handleTestSubmit} disabled={!inputs.testAnswer || loading}>
                                {loading ? 'Evaluating...' : 'Submit Answer'}
                            </Button>
                        </div>
                    </div>
                )}

                {/* 6. RESULT */}
                {step === STEPS.RESULT && session?.result && (
                    <ResultCard
                        result={session.result}
                        onReset={handleReset}
                        onRetry={handleRetry}
                    />
                )}

            </main>
        </div>
    );
};

export default Session;
