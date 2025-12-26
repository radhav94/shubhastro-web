import React, { useState, useEffect, useRef, useMemo } from 'react';
import styles from "./ChatWindow.module.scss";

const ChatTimer = () => {
    const [minutes, setMinutes] = useState(0);
    const secondsRef = useRef(0);
    const secondsDisplayRef = useRef(null);

    useEffect(() => {
        const interval = setInterval(() => {
            secondsRef.current += 1;

            // Logic: If seconds reach 60, update state to trigger a RE-RENDER
            if (secondsRef.current >= 60) {
                secondsRef.current = 0;
                setMinutes(prev => prev + 1);
            }

            // Manually update the seconds display (No Re-render)
            if (secondsDisplayRef.current) {
                secondsDisplayRef.current.innerText = secondsRef.current
                    .toString()
                    .padStart(2, '0');
            }
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    // useMemo will now only re-calculate once every 60 seconds
    // because 'minutes' is its only trigger.
    const memoizedMinutes = useMemo(() => {
        // console.log("Component Re-rendered: New minute calculated!");
        return minutes.toString().padStart(2, '0');
    }, [minutes]);

    return (
        <div>
            <span className={styles.duration}><span>{memoizedMinutes}</span>:<span ref={secondsDisplayRef}>00</span></span>
        </div>
    );
};

export default ChatTimer;