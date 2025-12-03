'use client';

import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { type HTMLProps, memo } from 'react';

import { AsideTitle } from '@/components/AsideTitle.js';
import AsideTokensSkeleton from '@/components/Token/AsideTokensSkeleton.js';
import { BookmarkedTokenItem } from '@/components/Token/BookmarkedTokenItem.js';
import { Source } from '@/constants/enum.js';
import { EMPTY_LIST } from '@/constants/index.js';
import { Link } from '@/esm/Link.js';
import { enqueueMessageFromError } from '@/helpers/enqueueMessage.js';
import { useCurrentProfileIds } from '@/hooks/useCurrentProfile.js';
import { useIsLogin } from '@/hooks/useIsLogin.js';
import { getTokenBookmarks } from '@/providers/firefly/endpoint/getTokenBookmarks.js';
import { captureBookmarkTokenViewEvent } from '@/providers/telemetry/captureTokenEvent.js';

export default memo(function BookmarkedTokens(props: HTMLProps<HTMLDivElement>) {
    const isLogin = useIsLogin();
    const profileIds = useCurrentProfileIds();
    const { data: tokens = [], isLoading } = useQuery({
        enabled: isLogin,
        queryKey: ['bookmarks', 'aside', Source.Tokens, profileIds],
        queryFn: async () => {
            if (!isLogin) return EMPTY_LIST;

            try {
                const page = await getTokenBookmarks(undefined, 5);
                return page.data;
            } catch (error) {
                enqueueMessageFromError(error, <Trans>Failed to fetch bookmarks.</Trans>);
                throw error;
            }
        },
    });

    if (!isLogin) return null;

    if (isLoading) return <AsideTokensSkeleton />;

    if (!tokens.length) return null;

    return (
        <div {...props} className={classNames(props.className, 'flex flex-col gap-2')}>
            <AsideTitle
                caption={<Trans>Bookmarked Token</Trans>}
                more={
                    <Link
                        href="/bookmarks/tokens"
                        className="text-medium text-highlight"
                        onClick={() => {
                            captureBookmarkTokenViewEvent('sidebar_more');
                        }}
                    >
                        <Trans>More</Trans>
                    </Link>
                }
            />
            <div>
                {tokens.map((token) => (
                    <BookmarkedTokenItem
                        key={token.id || `${token.chain_id}-${token.contract_address}`}
                        token={token}
                    />
                ))}
            </div>
        </div>
    );
});
