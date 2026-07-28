'use client';

import { FollowCategory, Source } from '@dimensiondev/enums';
import { classNames } from '@dimensiondev/utils';
import { Plural, Trans } from '@lingui/react/macro';
import { isUndefined } from 'lodash-es';
import { memo } from 'react';
import type { Components } from 'react-markdown';

import { Avatar } from '@/components/Avatar.js';
import { BioMarkup } from '@/components/Markup/BioMarkup.js';
import { PlainParagraph, VoidLineBreak } from '@/components/Markup/overrides.js';
import { FollowButton } from '@/components/Profile/FollowButton.js';
import { SocialSourceIcon } from '@/components/SocialSourceIcon.js';
import { Link } from '@/esm/Link.js';
import { nFormatter } from '@/helpers/formatCommentCounts.js';
import { getProfileUrl } from '@/helpers/getProfileUrl.js';
import { isBadProfile } from '@/helpers/isBadProfile.js';
import { isCurrentProfile } from '@/helpers/isCurrentProfile.js';
import { useIsMedium } from '@/hooks/useMediaQuery.js';
import type { Profile } from '@/providers/types/SocialMedia.js';
import { useGlobalState } from '@/store/useGlobalStore.js';

interface ProfileInListProps {
    profile: Profile;
    noFollowButton?: boolean;
    listKey?: string;
    index?: number;
    watchingFollowStatus?: boolean;
}

// Render the bio as a single line of plain text (no <p> block, no <br> line breaks) so it
// truncates cleanly under the stretched-link overlay. <a> is intentionally NOT overridden
// here: BioMarkup's default renderer makes @-handles (and other links) highlighted and
// clickable above the z-0 overlay.
const bioComponents: Components = {
    p: PlainParagraph,
    br: VoidLineBreak,
};

export const ProfileInList = memo<ProfileInListProps>(function ProfileInList({
    profile,
    noFollowButton,
    listKey,
    index,
    watchingFollowStatus = false,
}) {
    const isMedium = useIsMedium('max');

    const setScrollIndex = useGlobalState.use.setScrollIndex();

    const handleClickOnLink = () => {
        if (listKey && !isUndefined(index)) setScrollIndex(listKey, index);
    };

    const profileUrl = getProfileUrl(profile);

    const { source } = profile;
    const followerCount = profile.followerCount || 0;

    if (isBadProfile(profile)) {
        return (
            <div className="flex-start flex cursor-not-allowed gap-3 overflow-auto border-b border-secondaryLine p-3 hover:bg-bg dark:border-line">
                <SocialSourceIcon size={isMedium ? 40 : 44} className="rounded-full border" source={profile.source} />
                <div className="flex min-w-0 grow flex-col justify-center">
                    <span className="truncate text-lg font-bold leading-6">
                        <Trans>Undefined user</Trans>
                    </span>
                    {profile.profileId ? (
                        <span className="self-start text-medium leading-[22px] text-secondary">
                            ID: {profile.profileId}
                        </span>
                    ) : null}
                </div>
            </div>
        );
    }

    return (
        <div className="flex-start flex gap-3 overflow-auto border-b border-secondaryLine p-3 hover:bg-bg dark:border-line">
            <Link onClick={handleClickOnLink} className="shrink-0" href={profileUrl} prefetch={false}>
                <Avatar
                    className="rounded-full border"
                    src={profile.pfp}
                    size={isMedium ? 40 : 44}
                    alt={profile.displayName}
                />
            </Link>
            <div className="min-w-0 grow">
                <div className="flex-start flex gap-3">
                    <div className="flex-start flex flex-1 flex-col overflow-auto">
                        <p className="flex items-center gap-2 text-sm font-bold leading-5">
                            <Link className="truncate text-lg leading-6" href={profileUrl} prefetch={false}>
                                {profile.displayName}
                            </Link>
                            <SocialSourceIcon
                                mono
                                className="shrink-0 text-secondary"
                                size={16}
                                source={profile.source}
                            />
                        </p>
                        <div className="flex items-center whitespace-nowrap">
                            {profile.handle ? (
                                <Link
                                    className="self-start truncate text-medium leading-[22px] text-secondary"
                                    href={profileUrl}
                                    onClick={handleClickOnLink}
                                    prefetch={false}
                                >
                                    @{profile.handle}
                                </Link>
                            ) : null}
                            {[Source.Lens, Source.Farcaster].includes(profile.source) ? null : (
                                <>
                                    <span className="mx-1 leading-[22px] text-secondary">·</span>
                                    <Link
                                        prefetch={false}
                                        href={getProfileUrl(profile, FollowCategory.Followers)}
                                        className={classNames('gap-1 text-medium leading-[22px] hover:underline', {
                                            'pointer-events-none':
                                                source !== Source.Farcaster && source !== Source.Lens,
                                        })}
                                    >
                                        <data value={followerCount}>
                                            <span className="font-bold leading-[22px] text-lightMain">
                                                {nFormatter(followerCount)}{' '}
                                            </span>
                                            <span className="leading-[22px] text-secondary">
                                                <Plural value={followerCount} one="Follower" other="Followers" />
                                            </span>
                                        </data>
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                    {!noFollowButton && !isCurrentProfile(profile) ? (
                        <FollowButton
                            profile={profile}
                            watching={watchingFollowStatus}
                            variant={isMedium ? 'icon' : 'text'}
                            className={isMedium ? 'w-[50px] max-w-[50px]' : 'w-auto !min-w-0'}
                        />
                    ) : null}
                </div>
                {profile.bio ? (
                    <div className="relative mt-1.5">
                        {/* Stretched link: plain-text clicks on the bio navigate to the profile.
                            Bio @-handle links (z-[1], below) stay clickable above this z-0 overlay. */}
                        <Link
                            className="link-overlay"
                            href={profileUrl}
                            onClick={handleClickOnLink}
                            prefetch={false}
                            tabIndex={-1}
                            aria-hidden="true"
                        />
                        <BioMarkup
                            className="truncate text-sm [&_a]:relative [&_a]:z-1"
                            components={bioComponents}
                            source={profile.source}
                            profile={profile}
                        >
                            {profile.bio}
                        </BioMarkup>
                    </div>
                ) : null}
            </div>
        </div>
    );
});
