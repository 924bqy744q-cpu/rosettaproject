import React from 'react';
import './Input.css';

const Input = ({
    label,
    value,
    onChange,
    placeholder,
    type = 'text',
    autoFocus = false,
    className = ''
}) => {
    return (
        <div className={`input-group ${className}`}>
            {label && <label className="input-label">{label}</label>}
            {type === 'textarea' ? (
                <textarea
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    autoFocus={autoFocus}
                    className="input-field input-textarea"
                    rows={4}
                />
            ) : (
                <input
                    type={type}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    autoFocus={autoFocus}
                    className="input-field"
                />
            )}
        </div>
    );
};

export default Input;
