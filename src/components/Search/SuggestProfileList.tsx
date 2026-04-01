'use client';

import { EMPTY_LIST } from '@dimensiondev/constants';
import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { memo } from 'react';

import { Link } from '@/components/Link.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { SearchableProfileItem } from '@/components/Search/SearchableProfileItem.js';
import { SearchType } from '@/constants/enum.js';
import { STALE_TIMES } from '@/constants/query.js';
import { MAX_RECOMMEND_PROFILE_SIZE } from '@/constants/static.js';
import { toFireflyPlatformId } from '@/helpers/isSameProfile.js';
import { resolveSearchUrl } from '@/helpers/resolveSearchUrl.js';
import { searchProfilesByKeyword } from '@/services/searchProfilesByKeyword.js';

interface SuggestProfileListProps {
    query: string;
    onSelect?: () => void;
}

export const SuggestProfileList = memo<SuggestProfileListProps>(function SuggestProfileList({ query, onSelect }) {
    const { data: profiles = EMPTY_LIST, isLoading } = useQuery({
        queryKey: ['search-suggest', 'profiles', query],
        staleTime: STALE_TIMES.MINUTE_5,

        queryFn: async ({ signal }) => {
            const { profiles } = await searchProfilesByKeyword({
                keyword: query,
                signal,
                identitySize: 10,
                twitterSize: 7,
                bskySize: 3,
            });
            return profiles.slice(0, MAX_RECOMMEND_PROFILE_SIZE);
        },
        enabled: !!query,
    });

    if (!isLoading && !profiles.length) return null;

    return (
        <div>
            <h2 className="border-t border-line p-3 pb-2 text-sm font-bold leading-[18px]">
                <Trans>Users</Trans>
            </h2>
            {isLoading ? (
                <div className="flex flex-col items-center space-y-2 px-4 pb-5 pt-2 text-center text-sm font-bold">
                    <LoadingIcon />
                    <div className="font-bold">
                        <Trans>Searching users</Trans>
                    </div>
                </div>
            ) : profiles.length ? (
                <div>
                    {profiles.map(({ profile, related }) => (
                        <SearchableProfileItem
                            className="!border-0 !py-2"
                            profile={profile}
                            related={related}
                            key={toFireflyPlatformId(profile)}
                            onClick={onSelect}
                            autoQueryEnsAvatar
                        />
                    ))}
                </div>
            ) : (
                <div className="space-y-2 p-4 text-center text-sm font-bold">
                    <div className="font-bold">
                        <Trans>No matching users</Trans>
                    </div>
                </div>
            )}
            {profiles.length ? (
                <div className="px-3 pb-4 pt-2">
                    <Link
                        className="text-sm leading-[18px] text-secondary"
                        href={resolveSearchUrl(query, SearchType.Profiles)}
                    >
                        <Trans>Show more users</Trans>
                    </Link>
                </div>
            ) : null}
        </div>
    );
});
