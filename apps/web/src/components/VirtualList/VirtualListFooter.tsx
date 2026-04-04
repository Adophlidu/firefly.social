import { memo, type ReactNode, useEffect } from 'react';
import { useInView } from 'react-cool-inview';

import { LoadingIcon } from '@/components/LoadingIcon.js';
import { VirtualListFooterBottomText } from '@/components/VirtualList/VirtualListFooterBottomText.js';
import { useVirtualListScrollable } from '@/hooks/useVirtualListScrollable.js';

export interface VirtualListFooterProps {
    context?: {
        hasNextPage?: boolean;
        fetchNextPage?: () => Promise<unknown>;
        isFetching?: boolean;
        itemsRendered: boolean;
        isScrollable?: boolean;
        virtualListId?: string;
        footerText?: ReactNode;
    };
}
export const VirtualListFooter = memo<VirtualListFooterProps>(function VirtualListFooter({ context }) {
    const [isScrollable, onDetectScrollable] = useVirtualListScrollable(context?.virtualListId);
    const hasNextPage = context?.hasNextPage;
    const isFetching = context?.isFetching;
    const fetchNextPage = context?.fetchNextPage;
    /**
     * https://github.com/petyosi/react-virtuoso/issues/364
     * Similar to the problem mentioned above, sometimes when loading has already appeared within the window,
     * it does not yet request for the next page.
     */
    const { observe, inView } = useInView({
        rootMargin: '0px 0px',
    });

    /**
     * Sometimes the first page data may not be enough to fill the entire screen, causing the loading icon to always be in the inView state.
     * This prevents correctly fetching the next page, so we use effect to trigger fetching the next page.
     */
    useEffect(() => {
        if (inView && hasNextPage && !isFetching) {
            fetchNextPage?.();
        }
    }, [fetchNextPage, hasNextPage, inView, isFetching]);

    useEffect(() => {
        if (!hasNextPage) {
            onDetectScrollable();
        }
    }, [hasNextPage, onDetectScrollable]);

    if (!hasNextPage) {
        const shouldShowBottomText = context?.isScrollable ?? isScrollable;
        if (!shouldShowBottomText) return null;
        return <VirtualListFooterBottomText text={context?.footerText} />;
    }

    if (!context.itemsRendered) return null;

    return (
        <div className="flex items-center justify-center p-2" ref={observe}>
            <LoadingIcon size={16} />
        </div>
    );
});
