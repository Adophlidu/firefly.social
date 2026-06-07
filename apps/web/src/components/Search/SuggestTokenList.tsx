'use client';

import { EMPTY_LIST } from '@dimensiondev/constants';
import { SearchType, TokenPlatformType } from '@dimensiondev/enums';
import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { sortBy, uniqBy } from 'lodash-es';
import { memo } from 'react';

import { Link } from '@/components/Link.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { SearchableTokenItem } from '@/components/Search/SearchableTokenItem.js';
import { STALE_TIMES } from '@/constants/query.js';
import { resolveSearchUrl } from '@/helpers/resolveSearchUrl.js';
import { searchTokensBulk } from '@/providers/firefly/worker/searchTokensBulk.js';

interface SuggestTokenListProps {
    query: string;
    onSelect?: () => void;
}

export const SuggestTokenList = memo<SuggestTokenListProps>(function SuggestTokenList({ query, onSelect }) {
    const { data: tokens = EMPTY_LIST, isLoading } = useQuery({
        queryKey: ['search-tokens', query],
        staleTime: STALE_TIMES.MINUTE_5,

        queryFn: async () => {
            const data = await searchTokensBulk(query, true);
            return data;
        },
        select: (data) => {
            // prefer cex coins
            return uniqBy(
                sortBy(data, (x) => (x.platform_type === TokenPlatformType.Cex ? -1 : 0)),
                (x) => x.address,
            );
        },
        enabled: !!query,
    });

    if (!isLoading && !tokens.length) return null;

    return (
        <div>
            <h2 className="border-t border-line p-3 pb-2 text-sm font-bold leading-[18px]">
                <Trans>Tokens</Trans>
            </h2>
            {isLoading ? (
                <div className="flex flex-col items-center space-y-2 px-4 pb-5 pt-2 text-center text-sm font-bold">
                    <LoadingIcon />
                    <div className="font-bold">
                        <Trans>Searching tokens</Trans>
                    </div>
                </div>
            ) : tokens.length ? (
                <div>
                    {tokens.slice(0, 5).map((token) => (
                        <SearchableTokenItem
                            className="!border-0 !py-2"
                            showChange={false}
                            key={token.id}
                            token={token}
                            onClick={onSelect}
                        />
                    ))}
                </div>
            ) : (
                <div className="space-y-2 p-4 text-center text-sm font-bold">
                    <div className="font-bold">
                        <Trans>No matching token</Trans>
                    </div>
                </div>
            )}
            {tokens.length > 5 ? (
                <div className="px-3 pb-4 pt-2">
                    <Link
                        className="text-sm leading-[18px] text-secondary"
                        href={resolveSearchUrl(query, SearchType.Tokens)}
                        onClick={() => onSelect?.()}
                    >
                        <Trans>Show more tokens</Trans>
                    </Link>
                </div>
            ) : null}
        </div>
    );
});
