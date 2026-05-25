'use client';

import { classNames } from '@dimensiondev/utils';
import { useQuery } from '@tanstack/react-query';
import { type HTMLProps, memo } from 'react';

import { Avatar } from '@/components/Avatar.js';
import { ChannelTippy } from '@/components/Channel/ChannelTippy.js';
import { Link } from '@/components/Link.js';
import { SocialSourceIcon } from '@/components/SocialSourceIcon.js';
import { STALE_TIMES } from '@/constants/query.js';
import { getChannelUrl } from '@/helpers/getChannelUrl.js';
import { resolveChannelName } from '@/helpers/resolveChannelName.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import type { Channel } from '@/providers/types/SocialMedia.js';

interface ChannelAnchorProps extends HTMLProps<HTMLDivElement> {
    channel: Channel;
}

export const ChannelAnchor = memo<ChannelAnchorProps>(function ChannelAnchor({
    channel: propChannel,
    onClick,
    ...rest
}) {
    const { id, source } = propChannel;
    const { data } = useQuery({
        enabled: !!propChannel.__lazy__,
        queryKey: ['channel', source, id],
        staleTime: STALE_TIMES.MINUTE_5,
        queryFn: () => resolveSocialMediaProvider(source).getChannelById(id),
        select: (channel) => channel ?? propChannel,
    });

    const channel = propChannel.__lazy__ ? data : propChannel;
    if (!channel) return null;

    return (
        <div
            {...rest}
            className={classNames(rest.className, 'flex justify-end text-[12px] leading-[16px] text-main')}
            onClick={(event) => {
                event.stopPropagation();
                onClick?.(event);
            }}
        >
            <ChannelTippy channel={channel}>
                <Link href={getChannelUrl(channel)} className="flex items-center gap-1">
                    {channel.imageUrl ? (
                        <Avatar src={channel.imageUrl} alt="" size={15} className="size-[15px] rounded-full" />
                    ) : (
                        <SocialSourceIcon className="rounded-full" source={channel.source} size={15} />
                    )}
                    <span>{resolveChannelName(channel)}</span>
                </Link>
            </ChannelTippy>
        </div>
    );
});
