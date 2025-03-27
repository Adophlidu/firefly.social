import { useCallback, useEffect, useState } from 'react';

export function useVirtualListScrollable(id: string) {
    const [isScrollable, setIsScrollable] = useState<boolean>(false);
    const onDetect = useCallback(() => {
        const virtualScroller = document.getElementById(id);
        if (!virtualScroller) return;
        if (
            window.getComputedStyle(virtualScroller).overflow === 'visible' ||
            virtualScroller.getAttribute('data-use-window-scroll') === 'true'
        ) {
            setIsScrollable(virtualScroller.offsetTop + virtualScroller.clientHeight > window.innerHeight);
            return;
        }
        const virtualList = virtualScroller.querySelector('[data-testid="virtuoso-item-list"]');
        if (!virtualList) return;
        setIsScrollable(virtualScroller.clientHeight <= virtualList.clientHeight);
    }, [id]);

    useEffect(() => {
        onDetect();
    }, [onDetect]);

    return [isScrollable, onDetect] as const;
}
