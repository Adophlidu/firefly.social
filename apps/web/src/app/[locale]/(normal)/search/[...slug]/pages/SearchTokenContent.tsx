'use client';

import { Trans } from '@lingui/react/macro';
import { useSuspenseQuery } from '@tanstack/react-query';
import { redirect } from 'next/navigation.js';
import { useState } from 'react';

import { NoResultsFallback } from '@/components/NoResultsFallback.js';
import { Empty } from '@/components/Search/Empty.js';
import { SearchableTokenItem } from '@/components/Search/SearchableTokenItem.js';
import { searchTokens, type TokenWithMarket } from '@/providers/firefly/worker/searchTokens.js';
import { TokenPlatformType } from '@/providers/types/Firefly.js';
import { useSearchStateStore } from '@/store/useSearchStore.js';

export function SearchTokenContent() {
    const { searchKeyword } = useSearchStateStore();
    const [expandMap, setExpandMap] = useState<Partial<Record<TokenPlatformType | 'unknown', boolean>>>({});

    const { data: groups } = useSuspenseQuery({
        queryKey: ['search-tokens', searchKeyword],
        queryFn: async () => {
            if (!searchKeyword) return [];
            return searchTokens(searchKeyword, true);
        },
        select(tokens) {
            if (!tokens) return [];
            const cexCoins: TokenWithMarket[] = [];
            const dexCoins: TokenWithMarket[] = [];
            const normalCoins: TokenWithMarket[] = [];
            const groups: Array<{ group: TokenPlatformType | 'unknown'; tokens: TokenWithMarket[] }> = [];

            tokens.forEach((token) => {
                if (token.platform_type === TokenPlatformType.Cex) {
                    cexCoins.push(token);
                } else if (token.platform_type === TokenPlatformType.Dex) {
                    dexCoins.push(token);
                } else {
                    normalCoins.push(token);
                }
            });
            if (cexCoins.length)
                groups.push({
                    group: TokenPlatformType.Cex,
                    tokens: cexCoins,
                });

            if (dexCoins.length)
                groups.push({
                    group: TokenPlatformType.Dex,
                    tokens: dexCoins,
                });

            if (normalCoins.length)
                groups.push({
                    group: 'unknown',
                    tokens: normalCoins,
                });
            return groups;
        },
    });

    if (!groups.length) {
        if (!searchKeyword) redirect('/explore/tokens/trending');
        return <NoResultsFallback message={<Empty keyword={searchKeyword} />} />;
    }

    return (
        <>
            {groups.map(({ group, tokens }) => {
                return (
                    <div key={group}>
                        {group !== 'unknown' ? (
                            <h2 className="border-line flex h-10 items-center px-4 text-sm font-bold">
                                {group === TokenPlatformType.Cex ? <Trans>Coins</Trans> : <Trans>Dex</Trans>}
                            </h2>
                        ) : null}
                        {(expandMap[group] ? tokens : tokens.slice(0, 5)).map((token) => (
                            <SearchableTokenItem key={`${token.id}-${token.address}`} token={token} />
                        ))}
                        {tokens.length > 5 ? (
                            <div className="flex w-full items-center justify-center">
                                <div
                                    className="text-highlight w-full cursor-pointer text-center text-xs font-bold leading-6"
                                    onClick={() => {
                                        setExpandMap((map) => ({
                                            ...map,
                                            [group]: !map[group],
                                        }));
                                    }}
                                >
                                    {expandMap[group] ? <Trans>Show less</Trans> : <Trans>Show more</Trans>}
                                </div>
                            </div>
                        ) : null}
                    </div>
                );
            })}
        </>
    );
}
