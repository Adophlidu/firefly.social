'use client';

import { type RefCallback, useCallback, useRef, useState } from 'react';

import { Node } from '@/constants/browser.js';

export function useIntersectionObserver<T extends Element>(
    options: IntersectionObserverInit = {},
): [RefCallback<T>, IntersectionObserverEntry | null] {
    const { threshold = 1, root = null, rootMargin = '0px' } = options;
    const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);

    const previousObserver = useRef<IntersectionObserver>(null);

    const customRef = useCallback<RefCallback<T>>(
        (node) => {
            if (previousObserver.current) {
                previousObserver.current.disconnect();
                previousObserver.current = null;
            }
            if (!node || node.nodeType !== Node.ELEMENT_NODE) return;
            const observer = new IntersectionObserver(
                ([entry]) => {
                    setEntry(entry);
                },
                { threshold, root, rootMargin },
            );
            observer.observe(node);
            previousObserver.current = observer;
        },
        [threshold, root, rootMargin],
    );

    return [customRef, entry] as const;
}
