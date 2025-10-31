import { classNames } from '@firefly/utils';
import { Trans } from '@lingui/react/macro';
import { type HTMLProps, memo } from 'react';

import { Avatar } from '@/components/Avatar.js';
import { ChannelFollowerCount } from '@/components/Channel/ChannelFollowerCount.js';
import { ChannelInfoAction } from '@/components/Channel/ChannelInfoAction.js';
import { ChannelInfoBio } from '@/components/Channel/ChannelInfoBio.js';
import { Link } from '@/components/Link.js';
import { NoSSR } from '@/components/NoSSR.js';
import { SocialSourceIcon } from '@/components/SocialSourceIcon.js';
import { type SocialSource, Source } from '@/constants/enum.js';
import { getChannelUrl } from '@/helpers/getChannelUrl.js';
import type { Channel } from '@/providers/types/SocialMedia.js';

interface Props extends HTMLProps<HTMLDivElement> {
    channel: Channel;
    source: SocialSource;
    isChannelPage?: boolean;
    needRefetch?: boolean;
}

export const ChannelInfoUI = memo<Props>(function ChannelInfoUI({
    channel,
    isChannelPage = false,
    source,
    needRefetch,
    ...rest
}) {
    const url = getChannelUrl(channel);
    const avatar = channel.imageUrl ? (
        <Avatar src={channel.imageUrl} alt="avatar" size={40} className="size-10 rounded-full" />
    ) : (
        <SocialSourceIcon className="rounded-full" source={source} size={40} />
    );
    const name = <span className="text-lg font-black leading-6 text-lightMain">{channel.name}</span>;

    return (
        <article {...rest} className={classNames('flex gap-2.5 p-3', rest.className)}>
            {isChannelPage ? avatar : <Link href={url}>{avatar}</Link>}

            <div className="relative flex flex-1 flex-col gap-1">
                <NoSSR>
                    <ChannelInfoAction
                        className="absolute right-0 top-0 hidden md:flex"
                        channel={channel}
                        needRefetch={needRefetch}
                    />
                </NoSSR>

                <div className="flex flex-col gap-1">
                    <h1 className="flex items-center gap-1">
                        {isChannelPage ? name : <Link href={url}>{name}</Link>}
                        <SocialSourceIcon mono source={source} size={20} />
                    </h1>

                    <div className="flex flex-row items-center gap-1">
                        {[Source.Lens, Source.Bsky].includes(channel.source) ? (
                            channel.lead?.handle ? (
                                <>
                                    <span className="text-medium text-secondary">
                                        <Trans>By @{channel.lead?.handle || '-'}</Trans>
                                    </span>
                                    <span className="leading-[22px] text-secondary">·</span>
                                </>
                            ) : null
                        ) : (
                            <>
                                <span className="text-medium text-secondary">/{channel.id}</span>
                                <span className="leading-[22px] text-secondary">·</span>
                            </>
                        )}

                        <ChannelFollowerCount channel={channel} />
                    </div>
                </div>

                <ChannelInfoBio description={channel.description} />
            </div>
        </article>
    );
});
