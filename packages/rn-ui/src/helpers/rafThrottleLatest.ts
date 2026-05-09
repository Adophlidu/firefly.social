/**
 * Coalesces rapid updates to the latest value and flushes once per animation frame.
 */
export function createLatestRafThrottle<T>(onFlush: (value: T) => void): {
    schedule: (value: T) => void;
    dispose: () => void;
} {
    let rafId: number | null = null;
    let pending: T | null = null;

    const flush = () => {
        rafId = null;
        if (pending === null) return;
        const value = pending;
        pending = null;
        onFlush(value);
    };

    return {
        schedule(value: T) {
            pending = value;
            if (rafId !== null) return;
            rafId = requestAnimationFrame(flush);
        },
        dispose() {
            if (rafId !== null) {
                cancelAnimationFrame(rafId);
                rafId = null;
            }
            pending = null;
        },
    };
}
