import React, { useState, useEffect } from 'react';

interface DecryptionTextProps {
    text: string;
    speed?: number;
    delay?: number;
    className?: string;
}

const CHARS = "ABCDEF0123456789$#@%&*<>?/";

export function DecryptionText({ text, speed = 40, delay = 0, className }: DecryptionTextProps) {
    const [displayText, setDisplayText] = useState('');
    const [isComplete, setIsComplete] = useState(false);

    useEffect(() => {
        let timeout: NodeJS.Timeout;
        let iteration = 0;
        
        const startDecryption = () => {
            if (typeof text !== 'string') return;
            
            // Initial scrambling phase
            const flickerInterval = setInterval(() => {
                if (typeof text !== 'string') return;
                setDisplayText(text.split("").map(char => 
                    (char === ' ' || char === '\n') ? char : CHARS[Math.floor(Math.random() * CHARS.length)]
                ).join(""));
            }, 60);

            // Transition to resolution after 400ms
            setTimeout(() => {
                clearInterval(flickerInterval);
                const resolveInterval = setInterval(() => {
                    if (typeof text !== 'string') return;
                    setDisplayText(prev => {
                        const result = text.split("").map((char, index) => {
                            if (index < iteration) return char;
                            if (char === ' ' || char === '\n') return char;
                            return CHARS[Math.floor(Math.random() * CHARS.length)];
                        }).join("");

                        if (iteration >= text.length) {
                            clearInterval(resolveInterval);
                            setIsComplete(true);
                        }
                        
                        iteration += 1;
                        return result;
                    });
                }, speed);
            }, 400);
        };

        if (delay > 0) {
            timeout = setTimeout(startDecryption, delay);
        } else {
            startDecryption();
        }

        return () => clearTimeout(timeout);
    }, [text, speed, delay]);

    return (
        <span className={className}>
            {displayText}
        </span>
    );
}
