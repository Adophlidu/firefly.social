import { memo, type ReactNode, useEffect, useRef } from 'react';
import { useInView } from 'react-cool-inview';

import { LoadingIcon } from '@/components/LoadingIcon.js';
import { VirtualListFooterBottomText } from '@/components/VirtualList/VirtualListFooterBottomText.js';

export interface VirtualListFooterProps {
    context?: {
        hasNextPage?: boolean;
        fetchNextPage?: () => Promise<unknown>;
        isFetching?: boolean;
        itemsRendered: boolean;
        isScrollable?: boolean;
        footerText?: ReactNode;
    };
}
export const VirtualListFooter = memo<VirtualListFooterProps>(function VirtualListFooter({ context }) {
    /**
     * https://github.com/petyosi/react-virtuoso/issues/364
     * Similar to the problem mentioned above, sometimes when loading has already appeared within the window,
     * it does not yet request for the next page.
     */
    const { observe, inView } = useInView({
        rootMargin: '0px 0px',
    });

    const fetchedOnceInView = useRef(false);
    const hasNextPage = context?.hasNextPage;
    const isFetching = context?.isFetching;
    const isScrollable = context?.isScrollable;
    const fetchNextPage = context?.fetchNextPage;

    /**
     * Sometimes the first page data may not be enough to fill the entire screen, causing the loading icon to always be in the inView state.
     * This prevents correctly fetching the next page, so we use effect to trigger fetching the next page.
     */
    useEffect(() => {
        if (!inView) {
            fetchedOnceInView.current = false;
            return;
        }
        if (!hasNextPage || isFetching) return;

        // If the list isn't scrollable yet (not enough items to fill the viewport),
        // keep fetching pages until it becomes scrollable.
        if (!isScrollable) {
            fetchNextPage?.();
            return;
        }

        // Normal scrolling case: avoid repeated fetch loops while the footer stays in view.
        if (!fetchedOnceInView.current) {
            fetchedOnceInView.current = true;
            fetchNextPage?.();
        }
    }, [fetchNextPage, hasNextPage, inView, isFetching, isScrollable]);

    if (!context?.hasNextPage) {
        if (!context?.isScrollable) return null;
        return <VirtualListFooterBottomText text={context.footerText} />;
    }

    if (!context.itemsRendered) return null;

    return (
        <div className="flex items-center justify-center p-2" ref={observe}>
            <LoadingIcon size={16} />
        </div>
    );
});
