'use client';

import { useEffect, useRef } from 'react';

export function useClickAwayListener<T extends HTMLElement>(onClickAway: (event: Event) => void) {
    const ref = useRef<T | null>(null);
    useEffect(() => {
        function handleClickOutside(event: Event) {
            if (ref.current && !ref.current.contains(event.target as T)) {
                onClickAway(event);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [onClickAway]);
    return ref;
}
