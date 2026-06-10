import { useEffect, useMemo, useRef } from 'react';

interface UseLongPressOptions {
    /** ms the touch must be held before firing. */
    delay?: number;
    /** px of movement that cancels the press (treats it as a scroll). */
    moveThreshold?: number;
}

/**
 * Touch long-press detection (FW-7696 mobile share entry). Cancels on scroll/movement, and
 * suppresses the click that follows a fired long-press so tap actions underneath (e.g. the cell
 * title Link) don't trigger.
 */
export function useLongPress(onLongPress: () => void, { delay = 500, moveThreshold = 10 }: UseLongPressOptions = {}) {
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const startRef = useRef<{ x: number; y: number } | null>(null);
    const firedRef = useRef(false);
    const callbackRef = useRef(onLongPress);
    callbackRef.current = onLongPress;

    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    return useMemo(() => {
        const cancel = () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = null;
            startRef.current = null;
        };
        return {
            onTouchStart: (event: React.TouchEvent) => {
                const touch = event.touches[0];
                if (!touch) return;
                firedRef.current = false;
                startRef.current = { x: touch.clientX, y: touch.clientY };
                if (timerRef.current) clearTimeout(timerRef.current);
                timerRef.current = setTimeout(() => {
                    timerRef.current = null;
                    firedRef.current = true;
                    callbackRef.current();
                }, delay);
            },
            onTouchMove: (event: React.TouchEvent) => {
                const start = startRef.current;
                const touch = event.touches[0];
                if (!start || !touch) return;
                if (
                    Math.abs(touch.clientX - start.x) > moveThreshold ||
                    Math.abs(touch.clientY - start.y) > moveThreshold
                ) {
                    cancel();
                }
            },
            onTouchEnd: cancel,
            onTouchCancel: cancel,
            onClickCapture: (event: React.MouseEvent) => {
                if (!firedRef.current) return;
                firedRef.current = false;
                event.preventDefault();
                event.stopPropagation();
            },
        };
    }, [delay, moveThreshold]);
}
