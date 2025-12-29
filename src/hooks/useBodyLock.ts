'use client';

import { useEffect } from 'react';

let lockCount = 0;

export function useBodyLock(open = true) {
    useEffect(() => {
        if (typeof window === 'undefined' || !open) return;
        if (lockCount === 0) {
            document.body.style.overflow = 'hidden';
        }
        lockCount += 1;
        return () => {
            lockCount -= 1;
            if (lockCount === 0) {
                document.body.style.overflow = '';
            }
        };
    }, [open]);
}
