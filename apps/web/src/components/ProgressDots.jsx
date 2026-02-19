import React from 'react';
import './ProgressDots.css';

const ProgressDots = ({ currentStep, totalSteps = 5 }) => {
    return (
        <div className="progress-dots">
            {Array.from({ length: totalSteps }).map((_, index) => (
                <div
                    key={index}
                    className={`progress-dot ${index < currentStep ? 'active' : ''}`}
                />
            ))}
        </div>
    );
};

export default ProgressDots;
