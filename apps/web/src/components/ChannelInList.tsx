'use client';

import { Source } from '@dimensiondev/enums';
import { classNames } from '@dimensiondev/utils';
import { Plural, Trans } from '@lingui/react/macro';
import { isUndefined } from 'lodash-es';
import { type HTMLProps, memo } from 'react';

import { ToggleMutedChannelButton } from '@/components/Actions/ToggleMutedChannelButton.js';
import { Avatar } from '@/components/Avatar.js';
import { ChannelTippy } from '@/components/Channel/ChannelTippy.js';
import { FollowButton } from '@/components/Channel/FollowButton.js';
import { Link } from '@/components/Link.js';
import { BioMarkup } from '@/components/Markup/BioMarkup.js';
import { PlainParagraph, VoidLineBreak } from '@/components/Markup/overrides.js';
import { SocialSourceIcon } from '@/components/SocialSourceIcon.js';
import { nFormatter } from '@/helpers/formatCommentCounts.js';
import { getChannelUrl } from '@/helpers/getChannelUrl.js';
import { useIsSmall } from '@/hooks/useMediaQuery.js';
import type { Channel } from '@/providers/types/SocialMedia.js';
import { useGlobalState } from '@/store/useGlobalStore.js';

interface ChannelInListProps extends HTMLProps<HTMLDivElement> {
    channel: Channel;
    listKey?: string;
    index?: number;
    dense?: boolean;
    noFollowButton?: boolean;
    noMuteButton?: boolean;
    hideDescription?: boolean;
    showSourceAvatarWhenNoAvatar?: boolean;
    hideFollowersCount?: boolean;
}

// Render the description as a single line of plain text (no <p> block, no <br> line breaks)
// so it truncates cleanly under the stretched-link overlay. <a> is intentionally NOT
// overridden here: BioMarkup's default renderer makes links highlighted and clickable above
// the z-0 overlay.
const descriptionComponents = {
    p: PlainParagraph,
    br: VoidLineBreak,
};

export const ChannelInList = memo(function ChannelInList({
    channel,
    noFollowButton = true,
    noMuteButton = true,
    dense = false,
    hideDescription = false,
    showSourceAvatarWhenNoAvatar = true,
    hideFollowersCount = true,
    listKey,
    index,
    className,
    onClick,
}: ChannelInListProps) {
    const isSmall = useIsSmall('max');
    const setScrollIndex = useGlobalState.use.setScrollIndex();

    const handleClickOnLink = () => {
        if (listKey && !isUndefined(index)) setScrollIndex(listKey, index);
    };

    const avatarSize = isSmall || dense ? 40 : 44;
    const isBsky = channel.source === Source.Bsky;
    const isLens = channel.source === Source.Lens;
    const followerCount = channel.followerCount;

    return (
        <div
            className={classNames(
                'flex cursor-pointer justify-start overflow-auto border-b-lightLineSecond hover:bg-bg dark:border-line',
                {
                    'border-b p-3': !dense,
                    'px-4 py-2': dense,
                },
                className,
            )}
            onClick={onClick}
        >
            <div className="flex flex-1 items-center justify-start overflow-auto">
                <div className="mr-2.5 shrink-0 self-start">
                    <ChannelTippy channel={channel}>
                        <Link href={getChannelUrl(channel)} onClick={handleClickOnLink} prefetch={false}>
                            {!channel.imageUrl && showSourceAvatarWhenNoAvatar ? (
                                <SocialSourceIcon className="rounded-full" source={channel.source} size={avatarSize} />
                            ) : (
                                <Avatar
                                    className="rounded-full border"
                                    src={channel.imageUrl}
                                    size={avatarSize}
                                    alt={channel.name}
                                />
                            )}
                        </Link>
                    </ChannelTippy>
                </div>

                <div className="flex max-w-[calc(100%-40px-16px)] flex-1 flex-col justify-start overflow-auto">
                    <div className="flex items-center justify-start gap-1 text-sm font-bold leading-5">
                        <ChannelTippy channel={channel} className="mr-1 truncate">
                            <Link
                                href={getChannelUrl(channel)}
                                onClick={handleClickOnLink}
                                prefetch={false}
                                className="text-[18px] leading-6"
                            >
                                {channel.name}
                            </Link>
                        </ChannelTippy>
                        <SocialSourceIcon mono source={channel.source} size={16} className="shrink-0 text-secondary" />
                    </div>
                    <div className="flex items-center gap-2 text-sm leading-6 text-secondary">
                        <ChannelTippy channel={channel}>
                            {isLens || isBsky ? (
                                channel.lead?.handle ? (
                                    <Link
                                        href={getChannelUrl(channel)}
                                        onClick={handleClickOnLink}
                                        prefetch={false}
                                        className="truncate text-medium leading-[22px]"
                                    >
                                        <Trans>By @{channel.lead.handle}</Trans>
                                    </Link>
                                ) : null
                            ) : (
                                <Link
                                    href={getChannelUrl(channel)}
                                    onClick={handleClickOnLink}
                                    prefetch={false}
                                    className="truncate text-medium leading-[22px]"
                                >
                                    /{channel.id}
                                </Link>
                            )}
                        </ChannelTippy>
                        {isLens && hideFollowersCount ? null : (
                            <>
                                <span className="leading-[22px] text-secondary">·</span>

                                <Link href={getChannelUrl(channel)} onClick={handleClickOnLink} prefetch={false}>
                                    <data value={followerCount}>
                                        <span className="font-bold leading-[22px] text-lightMain">
                                            {nFormatter(followerCount)}{' '}
                                        </span>
                                        <span className="leading-[22px] text-secondary">
                                            {!isBsky ? (
                                                <Plural value={followerCount} one="Follower" other="Followers" />
                                            ) : (
                                                <Plural value={followerCount} one="Like" other="Likes" />
                                            )}
                                        </span>
                                    </data>
                                </Link>
                            </>
                        )}
                    </div>
                    {!dense && channel.description && !hideDescription ? (
                        <div className="relative mt-1.5">
                            {/* Stretched link: plain-text clicks on the description navigate to the
                                channel. Description @-handle links (z-[1], below) stay clickable. */}
                            <Link
                                className="link-overlay"
                                href={getChannelUrl(channel)}
                                onClick={handleClickOnLink}
                                prefetch={false}
                                tabIndex={-1}
                                aria-hidden="true"
                            />
                            <BioMarkup
                                className="truncate text-sm [&_a]:relative [&_a]:z-[1]"
                                components={descriptionComponents}
                                source={channel.source}
                            >
                                {channel.description ?? '-'}
                            </BioMarkup>
                        </div>
                    ) : null}
                </div>
            </div>

            {!noFollowButton ? (
                <div>
                    <FollowButton channel={channel} />
                </div>
            ) : null}

            {!noMuteButton ? (
                <div>
                    <ToggleMutedChannelButton channel={channel} />
                </div>
            ) : null}
        </div>
    );
});
