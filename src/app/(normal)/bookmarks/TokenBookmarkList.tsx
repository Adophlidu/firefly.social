'use client';

import { Trans } from '@lingui/react/macro';
import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { compact } from 'lodash-es';

import { ListInPage } from '@/components/ListInPage.js';
import { BookmarkedTokenItem } from '@/components/Token/BookmarkedTokenItem.js';
import { ScrollListKey, Source } from '@/constants/enum.js';
import { enqueueMessageFromError } from '@/helpers/enqueueMessage.js';
import { createIndicator } from '@/helpers/pageable.js';
import { useCurrentProfileIds } from '@/hooks/useCurrentProfile.js';
import { useIsLogin } from '@/hooks/useIsLogin.js';
import { getTokenBookmarks } from '@/providers/firefly/endpoint/getTokenBookmarks.js';
import type { Bookmarkable, TokenWithMarketData } from '@/providers/types/Firefly.js';

function getTokenItemContent(token: Bookmarkable<TokenWithMarketData>) {
    return <BookmarkedTokenItem className="border-b border-line !p-4" token={token} showMarketInfo />;
}

function ListHeader() {
    return (
        <div className="mt-3 flex px-4">
            <div className="font-inter text-[13px] leading-[17px] text-secondary">
                <Trans>Volume(24h) · Market Cap</Trans>
            </div>
            <div className="ml-auto text-right font-inter text-[13px] leading-[17px] text-secondary">
                Price · Change(24h)
            </div>
        </div>
    );
}

export function TokenBookmarkList() {
    const isLogin = useIsLogin();
    const profileIds = useCurrentProfileIds();

    const query = useSuspenseInfiniteQuery({
        queryKey: ['bookmarks', Source.Tokens, profileIds],
        queryFn: async ({ pageParam }) => {
            if (!isLogin) return;

            try {
                return await getTokenBookmarks(createIndicator(undefined, pageParam));
            } catch (error) {
                enqueueMessageFromError(error, <Trans>Failed to fetch bookmarks.</Trans>);
                throw error;
            }
        },
        initialPageParam: '',
        getNextPageParam: (lastPage) => {
            if (lastPage?.data.length === 0) return;
            return lastPage?.nextIndicator?.id;
        },
        select: (data) => compact(data.pages.flatMap((x) => x?.data)),
    });

    return (
        <ListInPage
            source={Source.Tokens}
            loginRequired
            key="tokens"
            queryResult={query}
            VirtualListProps={{
                listKey: `${ScrollListKey.Bookmark}:${Source.Tokens}`,
                computeItemKey: (_, token) => `${token.id}-${token.contract_address}`,
                itemContent: (_, item) => {
                    return getTokenItemContent(item);
                },
                components: {
                    Header: ListHeader,
                },
            }}
            NoResultsFallbackProps={{
                className: 'mt-20',
                message: (
                    <div className="mt-10">
                        <Trans>You haven&#39;t bookmarked any tokens.</Trans>
                    </div>
                ),
            }}
        />
    );
}
