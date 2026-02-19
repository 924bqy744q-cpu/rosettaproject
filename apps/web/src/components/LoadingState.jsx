import React, { useEffect, useState } from 'react';
import './LoadingState.css';

const LoadingState = ({ subsumer }) => {
    const [showSubsumer, setShowSubsumer] = useState(false);

    useEffect(() => {
        // Reveal subsumer after 1.5s as per design guide
        const timer = setTimeout(() => setShowSubsumer(true), 1500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="loading-state">
            <div className="spinner"></div>
            <div className="loading-text">Building your explanation...</div>
            <div className="loading-sub">Finding the right angle for how your mind works.</div>

            <div className={`subsumer-reveal ${showSubsumer ? 'visible' : ''}`}>
                Matched your knowledge to<br />
                <strong>{subsumer || 'a familiar concept'}</strong>
            </div>
        </div>
    );
};

export default LoadingState;
