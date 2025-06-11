import { useCallback, useEffect, useRef, useState } from 'react';

export function useDetectOverflow<T extends HTMLDivElement>(): [overflow: boolean, ref: (node: T | null) => void] {
    const [overflow, setOverflow] = useState(false);
    const resizeObserver = useRef<ResizeObserver | null>(null);
    const mutationObserver = useRef<MutationObserver | null>(null);
    const ref = useCallback((node: T | null) => {
        if (!node) return;
        resizeObserver.current?.disconnect();
        mutationObserver.current?.disconnect();
        const cb = () => {
            setOverflow(node.offsetWidth !== node.scrollWidth || node.offsetHeight !== node.scrollHeight);
        };
        resizeObserver.current = new ResizeObserver(cb);
        mutationObserver.current = new MutationObserver(cb);
        resizeObserver.current?.observe(node);
        mutationObserver.current?.observe(node, {
            attributes: true,
            childList: true,
            subtree: true,
        });
        cb();
    }, []);

    useEffect(
        () => () => {
            resizeObserver.current?.disconnect();
            mutationObserver.current?.disconnect();
        },
        [],
    );

    return [overflow, ref];
}
