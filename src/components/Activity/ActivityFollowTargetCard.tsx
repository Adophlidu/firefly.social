'use client';

import { Trans } from '@lingui/react/macro';

import { ActivityVerifyText } from '@/components/Activity/ActivityVerifyText.js';
import { useActivityClaimCondition } from '@/components/Activity/hooks/useActivityClaimCondition.js';
import { Link } from '@/components/Activity/Link.js';
import { Source } from '@/constants/enum.js';
import { BRIAN_FARCASTER_PROFILE } from '@/constants/mentions.js';
import { classNames } from '@/helpers/classNames.js';
import { getProfileUrl } from '@/helpers/getProfileUrl.js';

export function ActivityFollowTargetCard({ handle, profileId }: { handle: string; profileId: string }) {
    const { data } = useActivityClaimCondition(Source.Twitter);
    const isFollowed = !!(data?.x?.following || data?.farcaster?.isFollowing);

    return (
        <div
            className={classNames(
                'w-full rounded-2xl p-3 text-sm font-normal leading-6',
                isFollowed ? 'bg-success/10 dark:bg-success/20' : 'bg-bg',
            )}
        >
            <ActivityVerifyText verified={isFollowed}>
                <h3>
                    <Trans>
                        Followed{' '}
                        <Link
                            className="inline text-highlight"
                            href={getProfileUrl({
                                source: Source.Twitter,
                                profileId,
                                handle,
                            })}
                        >
                            @{handle}
                        </Link>{' '}
                        on X before Oct 12,2024, or followed{' '}
                        <Link
                            className="inline text-highlight"
                            href={getProfileUrl({
                                source: Source.Farcaster,
                                profileId: BRIAN_FARCASTER_PROFILE.platform_id,
                                handle: BRIAN_FARCASTER_PROFILE.handle,
                            })}
                        >
                            @{BRIAN_FARCASTER_PROFILE.handle}
                        </Link>{' '}
                        on Farcaster before Oct 20, 2024
                    </Trans>
                </h3>
            </ActivityVerifyText>
        </div>
    );
}
