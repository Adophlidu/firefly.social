'use client';

import { useEffect, useState } from 'react';

function useCountdown(endTime?: number, onEnd?: () => void) {
    const [remaining, setRemaining] = useState<number | null>(null);

    useEffect(() => {
        if (!endTime) return;
        const update = () => {
            const timeLeft = endTime - Date.now();
            setRemaining(timeLeft);
            if (timeLeft <= 0) {
                onEnd?.();
            }
        };
        update();
        const id = setInterval(update, 1000);
        return () => clearInterval(id);
    }, [endTime, onEnd]);

    if (remaining === null || remaining <= 0) return null;
    const totalSecs = Math.floor(remaining / 1000);
    const days = Math.floor(totalSecs / 86400);
    const hours = Math.floor((totalSecs % 86400) / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    if (days > 0) return { days, hours, mins, secs };
    if (hours > 0) return { hours, mins, secs };
    return { mins, secs };
}

function SlideChar({ char, animKey }: { char: string; animKey: string }) {
    return (
        <span
            key={animKey}
            style={{
                display: 'inline-block',
                width: '0.65em',
                textAlign: 'center',
                animation: 'countSlideIn 0.3s ease',
            }}
        >
            {char}
            <style>{`
                @keyframes countSlideIn {
                    from { transform: translateY(60%); opacity: 0; }
                    to   { transform: translateY(0);   opacity: 1; }
                }
            `}</style>
        </span>
    );
}

function SlideDigits({ value }: { value: number }) {
    const str = String(value).padStart(2, '0');
    return (
        <>
            <SlideChar key={`d0-${str[0]}`} char={str[0]} animKey={`d0-${str[0]}`} />
            <SlideChar key={`d1-${str[1]}`} char={str[1]} animKey={`d1-${str[1]}`} />
        </>
    );
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
    return (
        <div className="flex flex-col items-end gap-0.5">
            <span className="text-danger text-base font-black leading-tight">
                <SlideDigits value={value} />
            </span>
            <span className="text-second text-[10px] font-bold uppercase tracking-wider">{label}</span>
        </div>
    );
}

interface CountdownTimerProps {
    endTime?: number;
    onEnd?: () => void;
}

export function CountdownTimer({ endTime, onEnd }: CountdownTimerProps) {
    const countdown = useCountdown(endTime, onEnd);
    if (!countdown) return null;

    const units: Array<{ value: number; label: string }> = [];
    if ('days' in countdown) units.push({ value: countdown.days!, label: 'Days' });
    if ('hours' in countdown) units.push({ value: countdown.hours!, label: 'Hrs' });
    units.push({ value: countdown.mins, label: 'Mins' });
    units.push({ value: countdown.secs, label: 'Secs' });

    return (
        <div className="flex items-center gap-2.5">
            {units.map((u) => (
                <CountdownUnit key={u.label} value={u.value} label={u.label} />
            ))}
        </div>
    );
}
