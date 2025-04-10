import { Plural, Trans } from '@lingui/react/macro';
import { type HTMLProps, memo } from 'react';
import urlcat from 'urlcat';

import { Avatar } from '@/components/Avatar.js';
import { ChannelInfoAction } from '@/components/Channel/ChannelInfoAction.js';
import { ChannelInfoBio } from '@/components/Channel/ChannelInfoBio.js';
import { Link } from '@/components/Link.js';
import { NoSSR } from '@/components/NoSSR.js';
import { SocialSourceIcon } from '@/components/SocialSourceIcon.js';
import { type SocialSource, Source } from '@/constants/enum.js';
import { SITE_URL } from '@/constants/index.js';
import { classNames } from '@/helpers/classNames.js';
import { nFormatter } from '@/helpers/formatCommentCounts.js';
import { getChannelUrl } from '@/helpers/getChannelUrl.js';
import type { Channel } from '@/providers/types/SocialMedia.js';

interface Props extends HTMLProps<HTMLDivElement> {
    channel: Channel;
    source: SocialSource;
    isChannelPage?: boolean;
}

export const ChannelInfoUI = memo<Props>(function ChannelInfoUI({ channel, isChannelPage = false, source, ...rest }) {
    const followerCount = channel.followerCount ?? 0;
    const isBsky = channel.source === Source.Bsky;

    const url = urlcat(SITE_URL, getChannelUrl(channel));
    const avatar = channel.imageUrl ? (
        <Avatar src={channel.imageUrl} alt="avatar" size={48} className="size-12 rounded-full" />
    ) : (
        <SocialSourceIcon className="rounded-full" source={source} size={48} />
    );
    const name = <span className="text-lg font-black leading-6 text-lightMain">{channel.name}</span>;

    return (
        <article {...rest} className={classNames('flex gap-3 p-3', rest.className)}>
            {source === Source.Lens ? null : isChannelPage ? avatar : <Link href={url}>{avatar}</Link>}

            <div className="relative flex flex-1 flex-col gap-[6px]">
                <NoSSR>
                    <ChannelInfoAction channel={channel} />
                </NoSSR>

                <div className="flex flex-col">
                    <h1 className="flex items-center gap-2">
                        {isChannelPage ? name : <Link href={url}>{name}</Link>}
                        <SocialSourceIcon mono source={source} size={20} />
                    </h1>

                    {source === Source.Lens ? null : (
                        <div className="flex flex-row items-center gap-1">
                            {!isBsky ? (
                                <span className="text-medium text-secondary">/{channel.id}</span>
                            ) : (
                                <span className="text-medium text-secondary">
                                    <Trans>By @{channel.lead?.handle}</Trans>
                                </span>
                            )}

                            <span className="leading-[22px] text-secondary">·</span>

                            <data value={followerCount} className="flex items-center gap-1">
                                <span className="text-lightMain">{nFormatter(followerCount)}</span>
                                <span className="text-secondary">
                                    {!isBsky ? (
                                        <Plural value={followerCount} one="Member" other="Members" />
                                    ) : (
                                        <Plural value={followerCount} one="Like" other="Likes" />
                                    )}
                                </span>
                            </data>
                        </div>
                    )}
                </div>

                <ChannelInfoBio description={channel.description} />
            </div>
        </article>
    );
});
