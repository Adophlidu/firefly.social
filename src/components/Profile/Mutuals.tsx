'use client';

import { Trans } from '@lingui/react/macro';
import { useInfiniteQuery } from '@tanstack/react-query';

import { AvatarGroup } from '@/components/AvatarGroup.js';
import { Link } from '@/components/Link.js';
import { FollowCategory } from '@/constants/enum.js';
import { EMPTY_LIST } from '@/constants/static.js';
import { getProfileUrl } from '@/helpers/getProfileUrl.js';
import { isSameProfile } from '@/helpers/isSameProfile.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { useCurrentProfile } from '@/hooks/useCurrentProfile.js';
import { type Profile } from '@/providers/types/SocialMedia.js';

export function Mutuals({ profile }: { profile: Profile }) {
    const myProfile = useCurrentProfile(profile.source);

    const enabledMutuals = !isSameProfile(myProfile, profile);
    const profileId = profile.profileId;
    const source = profile.source;

    // Fetch the first page with useInfiniteQuery, the same as
    // MutualFollowersList, to make it reuseable in MutualFollowersList
    const { data } = useInfiniteQuery({
        enabled: enabledMutuals,
        queryKey: ['profiles', source, 'mutual-followers', myProfile?.profileId, profileId],
        queryFn: async () => {
            const provider = resolveSocialMediaProvider(source);
            return provider.getMutualFollowers(profile.profileId);
        },
        initialPageParam: '',
        getNextPageParam: (lastPage) => lastPage?.nextIndicator?.id,
        select: (data) => ({
            list: data.pages.flatMap((page) => page?.data ?? EMPTY_LIST),
            total: data.pages[0]?.total,
        }),
    });

    const mutuals = data?.list || [];
    const mutualCount = data?.total ?? mutuals.length;

    return enabledMutuals && mutualCount ? (
        <div className="break-word col-[1/3] mt-1 flex items-center gap-2 leading-[22px] hover:underline sm:col-[2/3]">
            <AvatarGroup profiles={mutuals.slice(0, 3)} AvatarProps={{ size: 20, className: 'border border-white' }} />
            <Link className="text-sm text-secondary" href={getProfileUrl(profile, FollowCategory.Mutuals)}>
                {mutualCount === 1 ? (
                    <Trans>Followed by {mutuals[0].displayName}</Trans>
                ) : mutualCount === 2 ? (
                    <Trans>
                        Followed by {mutuals[0].displayName} and {mutuals[1].displayName}
                    </Trans>
                ) : mutualCount === 3 ? (
                    <Trans>
                        Followed by {mutuals[0].displayName} , {mutuals[1].displayName}, and {mutuals[2].displayName}
                    </Trans>
                ) : (
                    <Trans>
                        Followed by {mutuals[0].displayName} , {mutuals[1].displayName}, and {mutualCount - 2} others
                        you follow
                    </Trans>
                )}
            </Link>
        </div>
    ) : null;
}
