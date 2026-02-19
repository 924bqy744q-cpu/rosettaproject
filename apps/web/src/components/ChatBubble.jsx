import React, { useEffect, useState } from 'react';
import './ChatBubble.css';

const ChatBubble = ({ message, sender = 'system', delay = 0 }) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setVisible(true), delay);
        return () => clearTimeout(timer);
    }, [delay]);

    if (!visible) return null;

    return (
        <div className={`chat-bubble chat-bubble-${sender} fade-in`}>
            {message}
        </div>
    );
};

export default ChatBubble;
