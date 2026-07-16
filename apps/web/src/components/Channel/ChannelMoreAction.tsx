'use client';

import MoreIcon from '@dimensiondev/assets/more-fill.svg';
import { Source } from '@dimensiondev/enums';
import { SITE_URL } from '@dimensiondev/envs/web';
import { MenuItem, type MenuProps } from '@headlessui/react';
import { memo } from 'react';
import urlcat from 'urlcat';

import { CopyLinkButton } from '@/components/Actions/CopyLinkButton.js';
import { MuteChannelButton } from '@/components/Actions/MuteChannelButton.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { MenuGroup } from '@/components/MenuGroup.js';
import { MoreActionMenu } from '@/components/MoreActionMenu.js';
import { getClubShareUrl } from '@/helpers/getChannelUrl.js';
import { useIsLoginFirefly } from '@/hooks/useIsLoginFirefly.js';
import { useShareUrl } from '@/hooks/useShareUrl.js';
import { useShortShareUrl } from '@/hooks/useShortShareUrl.js';
import { useToggleMutedChannel } from '@/hooks/useToggleMutedChannel.js';
import type { Channel } from '@/providers/types/SocialMedia.js';

interface MoreProps extends Omit<MenuProps<'div'>, 'className'> {
    channel: Channel;
    className?: string;
}

export const ChannelMoreAction = memo<MoreProps>(function ChannelMoreAction({ channel }) {
    const isLogin = useIsLoginFirefly();
    const [{ loading: channelBlocking }, toggleBlockChannel] = useToggleMutedChannel();

    const longUrl = useShareUrl(urlcat(SITE_URL, getClubShareUrl(channel)));
    const { register } = useShortShareUrl(longUrl);

    return (
        <MoreActionMenu
            source={channel.source}
            button={
                channelBlocking ? (
                    <span className="inline-flex size-8 animate-spin items-center justify-center">
                        <LoadingIcon size={16} />
                    </span>
                ) : (
                    <span className="inline-flex size-8 items-center justify-center rounded-lg border border-lightLineSecond">
                        <MoreIcon width={21} height={21} />
                    </span>
                )
            }
        >
            <MenuGroup>
                <MenuItem>{({ close }) => <CopyLinkButton getLink={register} onClick={close} />}</MenuItem>
                {isLogin && channel.source === Source.Farcaster ? (
                    <MenuItem>
                        {({ close }) => (
                            <MuteChannelButton channel={channel} onToggle={toggleBlockChannel} onClick={close} />
                        )}
                    </MenuItem>
                ) : null}
            </MenuGroup>
        </MoreActionMenu>
    );
});
