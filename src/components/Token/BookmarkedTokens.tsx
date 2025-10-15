'use client';

import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { type HTMLProps, memo } from 'react';

import { BookmarkedTokenItem } from '@/components/Token/BookmarkedTokenItem.js';
import { Source } from '@/constants/enum.js';
import { EMPTY_LIST } from '@/constants/index.js';
import { Link } from '@/esm/Link.js';
import { classNames } from '@/helpers/classNames.js';
import { enqueueMessageFromError } from '@/helpers/enqueueMessage.js';
import { useCurrentProfileIds } from '@/hooks/useCurrentProfile.js';
import { useIsLogin } from '@/hooks/useIsLogin.js';
import { FireflySocialMediaProvider } from '@/providers/firefly/SocialMedia.js';
import { captureBookmarkTokenViewEvent } from '@/providers/telemetry/captureTokenEvent.js';

export const BookmarkedTokens = memo(function BookmarkedTokens(props: HTMLProps<HTMLDivElement>) {
    const isLogin = useIsLogin();
    const profileIds = useCurrentProfileIds();
    const { data: tokens = [] } = useQuery({
        enabled: isLogin,
        queryKey: ['bookmarks', 'aside', Source.Tokens, profileIds],
        queryFn: async () => {
            if (!isLogin) return EMPTY_LIST;
            try {
                const page = await FireflySocialMediaProvider.getTokenBookmarks(undefined, 5);
                return page.data;
            } catch (error) {
                enqueueMessageFromError(error, <Trans>Failed to fetch bookmarks.</Trans>);
                throw error;
            }
        },
    });

    if (!tokens.length || !isLogin) return null;

    return (
        <div {...props} className={classNames(props.className, 'flex flex-col gap-2')}>
            <div className="flex px-2">
                <div className="text-xl font-bold leading-6 text-main">
                    <Trans>Bookmarked Token</Trans>
                </div>
                <Link
                    href="/bookmarks/tokens"
                    className="ml-auto text-medium font-bold text-highlight"
                    onClick={() => {
                        captureBookmarkTokenViewEvent('sidebar_more');
                    }}
                >
                    <Trans>More</Trans>
                </Link>
            </div>
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
