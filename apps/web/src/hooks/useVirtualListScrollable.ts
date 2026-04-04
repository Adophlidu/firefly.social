import { useCallback, useEffect, useState } from 'react';

export function useVirtualListScrollable(id: string | undefined) {
    const [isScrollable, setIsScrollable] = useState<boolean>(false);

    const onDetect = useCallback(() => {
        if (!id) return;
        const virtualScroller = document.getElementById(id);
        if (!virtualScroller) return;

        let nextScrollable: boolean;
        if (
            window.getComputedStyle(virtualScroller).overflow === 'visible' ||
            virtualScroller.getAttribute('data-use-window-scroll') === 'true'
        ) {
            nextScrollable = virtualScroller.offsetTop + virtualScroller.clientHeight > window.innerHeight;
        } else {
            const virtualList = virtualScroller.querySelector('[data-testid="virtuoso-item-list"]');
            if (!virtualList) return;
            nextScrollable = virtualScroller.clientHeight <= virtualList.clientHeight;
        }

        setIsScrollable((prev) => (prev === nextScrollable ? prev : nextScrollable));
    }, [id]);

    useEffect(() => {
        if (!id) return;
        // Defer initial detection to avoid triggering during Virtuoso's initialization
        // which can cause reactive cycles with restoreStateFrom
        const timeoutId = window.setTimeout(onDetect, 0);
        return () => window.clearTimeout(timeoutId);
    }, [id, onDetect]);

    useEffect(() => {
        if (!id || typeof ResizeObserver === 'undefined') return;

        const virtualScroller = document.getElementById(id);
        if (!virtualScroller) return;

        const resizeObserver = new ResizeObserver(onDetect);
        resizeObserver.observe(virtualScroller);

        const virtualList = virtualScroller.querySelector('[data-testid="virtuoso-item-list"]');
        if (virtualList instanceof HTMLElement) {
            resizeObserver.observe(virtualList);
        }

        return () => resizeObserver.disconnect();
    }, [id, onDetect]);

    return [isScrollable, onDetect] as const;
}
