import { useEffect, useState } from 'react';

function getFundingCountdown() {
    const now = new Date();

    const nextHour = new Date(now);
    nextHour.setHours(now.getHours() + 1);
    nextHour.setMinutes(0);
    nextHour.setSeconds(0);
    nextHour.setMilliseconds(0);

    const diff = nextHour.getTime() - now.getTime();
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function useCountdown() {
    const [countdown, setCountdown] = useState(getFundingCountdown);

    useEffect(() => {
        const interval = setInterval(() => {
            setCountdown(getFundingCountdown());
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    return countdown;
}
