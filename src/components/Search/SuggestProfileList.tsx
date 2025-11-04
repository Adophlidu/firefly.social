import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { compact } from 'lodash-es';
import { memo } from 'react';

import { Link } from '@/components/Link.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { SearchableProfileItem } from '@/components/Search/SearchableProfileItem.js';
import { SearchType, Source } from '@/constants/enum.js';
import { MAX_RECOMMEND_PROFILE_SIZE } from '@/constants/index.js';
import { composeSearchProfiles, formatSearchProfile } from '@/helpers/formatSearchProfile.js';
import { toFireflyPlatformId } from '@/helpers/isSameProfile.js';
import { resolveSearchUrl } from '@/helpers/resolveSearchUrl.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { useIsLogin } from '@/hooks/useIsLogin.js';
import { BskySocialMediaProvider } from '@/providers/bsky/SocialMedia.js';
import { fireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import { TwitterSocialMediaProxy } from '@/providers/twitter/SocialMedia.js';

interface SuggestProfileListProps {
    query: string;
    onSelect?: () => void;
}

export const SuggestProfileList = memo<SuggestProfileListProps>(function SuggestProfileList({ query, onSelect }) {
    const isTwitterLogin = useIsLogin(Source.Twitter);
    const { data: profiles = [], isLoading } = useQuery({
        queryKey: ['search-suggest', 'profiles', query],
        staleTime: 1000 * 60 * 5, // 5 minutes
        queryFn: async () => {
            const result = await fireflyEndpointProvider.searchIdentity(query, {
                size: 5,
                indicator: undefined,
            });
            const trimmed = query.trim().replace(/^@/, '');
            const xProfilesRes =
                isTwitterLogin && trimmed
                    ? await runInSafeAsync(() => TwitterSocialMediaProxy.searchProfiles(trimmed))
                    : undefined;
            const bskyProfilesRes = await runInSafeAsync(() => BskySocialMediaProvider.searchProfiles(query));

            const xProfiles = (xProfilesRes?.data || []).slice(0, 1);
            const bskyProfiles = (bskyProfilesRes?.data || []).slice(0, 1);

            return composeSearchProfiles(
                compact(result.data.map((x) => formatSearchProfile(x, query))).slice(
                    0,
                    MAX_RECOMMEND_PROFILE_SIZE - xProfiles.length - bskyProfiles.length,
                ),
                xProfiles,
                bskyProfiles,
            );
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
                    {profiles.slice(0, MAX_RECOMMEND_PROFILE_SIZE).map(({ profile, related }) => (
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
