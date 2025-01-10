import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { memo } from 'react';

import { Link } from '@/components/Link.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { SearchableTokenItem } from '@/components/Search/SearchableTokenItem.js';
import { SearchType } from '@/constants/enum.js';
import { resolveSearchUrl } from '@/helpers/resolveSearchUrl.js';
import { searchTokens } from '@/services/searchTokens.js';

interface SuggestTokenListProps {
    query: string;
    onSelect?: () => void;
}

export const SuggestTokenList = memo<SuggestTokenListProps>(function SuggestTokenList({ query, onSelect }) {
    const { data: tokens, isLoading } = useQuery({
        queryKey: ['search-suggest', 'tokens', query],
        staleTime: 1000 * 60 * 5, // 5 minutes
        queryFn: async () => {
            const data = await searchTokens(query);
            return data.data;
        },
        enabled: !!query,
    });

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
            ) : tokens?.length ? (
                <div>
                    {tokens.slice(0, 5).map((token) => (
                        <SearchableTokenItem
                            className="!border-0 !py-2"
                            showRate={false}
                            key={token.id}
                            token={token}
                            onClick={onSelect}
                        />
                    ))}
                </div>
            ) : (
                <div className="space-y-2 px-4 py-4 text-center text-sm font-bold">
                    <div className="font-bold">
                        <Trans>No matching token</Trans>
                    </div>
                </div>
            )}
            <div className="px-3 pb-4 pt-2">
                <Link
                    className="text-sm leading-[18px] text-secondary"
                    href={resolveSearchUrl(query, SearchType.Tokens)}
                >
                    <Trans>Show more tokens</Trans>
                </Link>
            </div>
        </div>
    );
});
