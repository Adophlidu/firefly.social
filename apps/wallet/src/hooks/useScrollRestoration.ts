import { useLocation } from '@tanstack/react-router';
import { atom, useAtom } from 'jotai';
import { useEffect, useRef } from 'react';

const scrollPositionsAtom = atom<Record<string, number>>({});

export function useScrollRestoration() {
    const location = useLocation();
    const href = location.href;
    const hasRestored = useRef(false);
    const [scrollPositions, setScrollPositions] = useAtom(scrollPositionsAtom);

    // Save scroll position on scroll
    useEffect(() => {
        const handleScroll = () => {
            setScrollPositions((prev) => ({ ...prev, [href]: window.scrollY }));
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, [href, setScrollPositions]);

    // Restore scroll position (once)
    useEffect(() => {
        if (hasRestored.current) return;
        hasRestored.current = true;

        const savedPosition = scrollPositions[href];

        if (savedPosition !== undefined) {
            window.scrollTo(0, savedPosition);
        }
    }, [href, scrollPositions]);
}
