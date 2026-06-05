import { useEffect, useRef } from 'react';

const USER_INTERACTION_EVENTS = ['pointerenter', 'pointerdown', 'mousedown', 'touchstart', 'keydown', 'wheel'] as const;

export function useFixedScrollInToViewBeforeUserInteraction(enabled: boolean, ref: Element | null) {
    const frameRef = useRef<number | null>(null);

    useEffect(() => {
        if (!enabled || !ref) return;
        const abort = new AbortController();
        const { signal } = abort;
        if (!document.body) return;

        const scheduleScroll = () => {
            if (signal.aborted) return;
            frameRef.current ??= window.requestAnimationFrame(() => {
                frameRef.current = null;
                if (signal.aborted || !ref) return;
                ref.scrollIntoView({ behavior: 'instant' });
            });
        };

        const observer = new MutationObserver(scheduleScroll);

        const stop = () => {
            abort.abort();
            frameRef.current && window.cancelAnimationFrame(frameRef.current);
            frameRef.current = null;
            observer.disconnect();
        };

        observer.observe(document.body, {
            attributes: true,
            characterData: true,
            childList: true,
            subtree: true,
        });

        for (const eventName of USER_INTERACTION_EVENTS) {
            window.addEventListener(eventName, stop, { capture: true, passive: true, signal });
        }

        scheduleScroll();

        return () => stop();
    }, [enabled, ref]);
}
