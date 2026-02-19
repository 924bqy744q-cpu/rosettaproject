import React from 'react';
import './SegmentedControl.css';

const SegmentedControl = ({ options, value, onChange }) => {
    return (
        <div className="segmented-control">
            {options.map((option) => (
                <button
                    key={option.value}
                    type="button"
                    className={`segmented-btn ${value === option.value ? 'selected' : ''}`}
                    onClick={() => onChange(option.value)}
                >
                    {option.label}
                </button>
            ))}
        </div>
    );
};

export default SegmentedControl;
