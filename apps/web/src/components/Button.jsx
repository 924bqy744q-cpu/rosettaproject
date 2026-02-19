import React from 'react';
import './Button.css';

/**
 * Button Component
 * @param {string} variant - primary | secondary | ghost
 * @param {boolean} disabled
 * @param {function} onClick
 * @param {React.ReactNode} children
 * @param {string} className
 */
const Button = ({
    variant = 'primary',
    disabled = false,
    onClick,
    children,
    className = '',
    type = 'button'
}) => {
    return (
        <button
            type={type}
            className={`btn btn-${variant} ${className}`}
            disabled={disabled}
            onClick={onClick}
        >
            {children}
        </button>
    );
};

export default Button;
