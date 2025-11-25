import { classNames } from '@dimensiondev/utils';
import { Plural, Trans } from '@lingui/react/macro';
import { isUndefined } from 'lodash-es';
import type { HTMLProps } from 'react';
import { memo } from 'react';

import { ToggleMutedChannelButton } from '@/components/Actions/ToggleMutedChannelButton.js';
import { Avatar } from '@/components/Avatar.js';
import { ChannelTippy } from '@/components/Channel/ChannelTippy.js';
import { FollowButton } from '@/components/Channel/FollowButton.js';
import { Link } from '@/components/Link.js';
import { BioMarkup } from '@/components/Markup/BioMarkup.js';
import { PlainParagraph, VoidLineBreak } from '@/components/Markup/overrides.js';
import { SocialSourceIcon } from '@/components/SocialSourceIcon.js';
import { Source } from '@/constants/enum.js';
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

const overrideComponents = {
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

    const avatarSize = isSmall || dense ? 40 : 44;
    const isBsky = channel.source === Source.Bsky;
    const isLens = channel.source === Source.Lens;

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
            <Link
                className="flex flex-1 items-center justify-start overflow-auto"
                onClick={() => {
                    if (listKey && !isUndefined(index)) setScrollIndex(listKey, index);
                }}
                href={getChannelUrl(channel)}
            >
                <div className="mr-2.5 shrink-0 self-start">
                    <ChannelTippy channel={channel}>
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
                    </ChannelTippy>
                </div>

                <div className="flex max-w-[calc(100%-40px-16px)] flex-1 flex-col justify-start overflow-auto">
                    <div className="flex items-center justify-start gap-1 text-sm font-bold leading-5">
                        <ChannelTippy channel={channel} className="mr-1 truncate">
                            <span className="text-[18px] leading-6">{channel.name}</span>
                        </ChannelTippy>
                        <SocialSourceIcon mono source={channel.source} size={16} className="shrink-0 text-secondary" />
                    </div>
                    <div className="flex items-center gap-2 text-sm leading-6 text-secondary">
                        <ChannelTippy channel={channel}>
                            {isLens || isBsky ? (
                                channel.lead?.handle ? (
                                    <p className="truncate text-medium leading-[22px]">
                                        <Trans>By @{channel.lead.handle}</Trans>
                                    </p>
                                ) : null
                            ) : (
                                <p className="truncate text-medium leading-[22px]">/{channel.id}</p>
                            )}
                        </ChannelTippy>
                        {isLens && hideFollowersCount ? null : (
                            <>
                                <span className="leading-[22px] text-secondary">·</span>

                                <data value={channel.followerCount}>
                                    <span className="font-bold leading-[22px] text-lightMain">
                                        {nFormatter(channel.followerCount)}{' '}
                                    </span>
                                    <span className="leading-[22px] text-secondary">
                                        {!isBsky ? (
                                            <Plural value={channel.followerCount} one="Follower" other="Followers" />
                                        ) : (
                                            <Plural value={channel.followerCount} one="Like" other="Likes" />
                                        )}
                                    </span>
                                </data>
                            </>
                        )}
                    </div>
                    {!dense && channel.description && !hideDescription ? (
                        <BioMarkup
                            className="mt-1.5 truncate text-sm"
                            components={overrideComponents}
                            source={channel.source}
                        >
                            {channel.description ?? '-'}
                        </BioMarkup>
                    ) : null}
                </div>
            </Link>

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
