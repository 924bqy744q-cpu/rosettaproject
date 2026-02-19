import React, { useEffect, useState } from 'react';
import './ExplanationChunk.css';

const ExplanationChunk = ({ chunkNumber, text, delay = 0, totalChunks }) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setVisible(true), delay);
        return () => clearTimeout(timer);
    }, [delay]);

    return (
        <div className={`explanation-chunk ${visible ? 'visible' : ''}`}>
            <div className="chunk-meta">
                Chunk {chunkNumber} of {totalChunks}
            </div>
            <div className="chunk-content">
                {text}
            </div>
        </div>
    );
};

export default ExplanationChunk;
