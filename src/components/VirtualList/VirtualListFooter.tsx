import { memo, useEffect } from 'react';
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

    useEffect(() => {
        if (inView && context?.hasNextPage && !context.isFetching) {
            context.fetchNextPage?.();
        }
    }, [context?.isFetching, context?.hasNextPage, inView]);

    if (!context?.hasNextPage) {
        if (!context?.isScrollable) return null;
        return <VirtualListFooterBottomText />;
    }

    if (!context.itemsRendered) return null;

    return (
        <div className="flex items-center justify-center p-2" ref={observe}>
            <LoadingIcon size={16} />
        </div>
    );
});
