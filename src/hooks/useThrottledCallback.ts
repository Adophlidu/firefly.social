import { useCallback, useMemo, useRef } from 'react';

type ThrottledCallback<T extends (...args: any[]) => void> = T & {
    cancel: () => void;
};

/**
 * Creates a throttled callback using requestAnimationFrame.
 * The callback will be executed at most once per animation frame (~60fps),
 * making it ideal for scroll and resize event handlers.
 *
 * @param callback - The function to throttle
 * @returns A throttled version of the callback with a cancel method
 *
 * @example
 * ```tsx
 * const handleScroll = useThrottledCallback(() => {
 *   // This will run at most once per frame
 *   console.log('Scrolled');
 * });
 *
 * useEffect(() => {
 *   window.addEventListener('scroll', handleScroll, { passive: true });
 *   return () => {
 *     window.removeEventListener('scroll', handleScroll);
 *     handleScroll.cancel(); // Cancel any pending frame
 *   };
 * }, [handleScroll]);
 * ```
 */
export function useThrottledCallback<T extends (...args: any[]) => void>(callback: T): ThrottledCallback<T> {
    const rafIdRef = useRef<number | null>(null);
    const callbackRef = useRef(callback);

    // Keep callback ref up to date
    callbackRef.current = callback;

    const cancel = useCallback(() => {
        if (rafIdRef.current !== null) {
            cancelAnimationFrame(rafIdRef.current);
            rafIdRef.current = null;
        }
    }, []);

    const throttledCallback = useMemo(() => {
        const fn = ((...args: Parameters<T>) => {
            if (rafIdRef.current !== null) return;

            rafIdRef.current = requestAnimationFrame(() => {
                callbackRef.current(...args);
                rafIdRef.current = null;
            });
        }) as unknown as ThrottledCallback<T>;

        // Attach cancel method
        fn.cancel = cancel;
        return fn;
    }, [cancel]);

    return throttledCallback;
}
