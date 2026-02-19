import React from 'react';
import { Check, X, RotateCcw } from 'lucide-react';
import Button from './Button';
import './ResultCard.css';

const ResultCard = ({ result, onRetry, onReset }) => {
    const isSuccess = result.score === 'integrated';

    return (
        <div className="result-card fade-in">
            <div className="result-icon">
                {isSuccess ? '✦' : (result.score === 'surface' ? '✓' : '✗')}
            </div>

            <h2 className="result-title">
                {isSuccess ? 'It clicked.' : 'Almost there.'}
            </h2>

            <p className="result-reasoning">
                {result.reasoning || "You connected the core concept."}
            </p>

            <div className={`result-feedback ${isSuccess ? 'success' : 'neutral'}`}>
                <div className="feedback-icon">
                    {isSuccess ? <Check size={16} /> : <div className="dot" />}
                </div>
                <div className="feedback-content">
                    <div className="feedback-label">Your answer: {result.score}</div>
                    <div className="feedback-sub">{isSuccess ? "That's genuine understanding." : "Let's try a different angle."}</div>
                </div>
            </div>

            <div className="result-actions">
                {isSuccess ? (
                    <Button onClick={onReset} variant="secondary">Explore another concept</Button>
                ) : (
                    <Button onClick={onRetry} variant="primary">
                        <RotateCcw size={16} style={{ marginRight: 8 }} /> Try another analogy
                    </Button>
                )}
            </div>
        </div>
    );
};

export default ResultCard;
