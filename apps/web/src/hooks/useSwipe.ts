import { useEffect, useRef } from 'react';

type SwipeDirection = 'left' | 'right' | 'none';

interface SwipeHookOptions {
    threshold?: number; // max distance in pixels to consider a swipe, default 50
    preventDefault?: boolean; // whether to call preventDefault on touchmove, default true
}

const useSwipe = (
    ref: React.RefObject<HTMLElement | null>,
    callback: (direction: SwipeDirection) => void,
    options: SwipeHookOptions = {},
) => {
    const { threshold = 50, preventDefault = true } = options;

    const startX = useRef(0);
    const isPointerDown = useRef(false);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const handlePointerDown = (e: PointerEvent) => {
            isPointerDown.current = true;
            startX.current = e.clientX;
        };

        const handlePointerMove = (e: PointerEvent) => {
            if (!isPointerDown.current) return;
            if (preventDefault) e.preventDefault();
        };

        const handlePointerUp = (e: PointerEvent) => {
            if (!isPointerDown.current) return;

            const endX = e.clientX;
            const diffX = endX - startX.current;

            if (Math.abs(diffX) > threshold) {
                const direction: SwipeDirection = diffX > 0 ? 'right' : 'left';
                callback(direction);
            } else {
                callback('none');
            }

            isPointerDown.current = false;
        };

        const handlePointerLeave = () => {
            isPointerDown.current = false;
        };

        element.addEventListener('pointerdown', handlePointerDown);
        element.addEventListener('pointermove', handlePointerMove);
        element.addEventListener('pointerup', handlePointerUp);
        element.addEventListener('pointerleave', handlePointerLeave);

        return () => {
            element.removeEventListener('pointerdown', handlePointerDown);
            element.removeEventListener('pointermove', handlePointerMove);
            element.removeEventListener('pointerup', handlePointerUp);
            element.removeEventListener('pointerleave', handlePointerLeave);
        };
    }, [ref, callback, threshold, preventDefault]);
};

export default useSwipe;
