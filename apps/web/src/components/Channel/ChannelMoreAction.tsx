'use client';

import { Source } from '@dimensiondev/enums';
import MoreIcon from '@dimensiondev/assets/more-fill.svg';
import { MenuItem, type MenuProps } from '@headlessui/react';
import { memo } from 'react';

import { CopyLinkButton } from '@/components/Actions/CopyLinkButton.js';
import { MuteChannelButton } from '@/components/Actions/MuteChannelButton.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { MenuGroup } from '@/components/MenuGroup.js';
import { MoreActionMenu } from '@/components/MoreActionMenu.js';

import { getChannelUrl } from '@/helpers/getChannelUrl.js';
import { useIsLoginFirefly } from '@/hooks/useIsLoginFirefly.js';
import { useToggleMutedChannel } from '@/hooks/useToggleMutedChannel.js';
import type { Channel } from '@/providers/types/SocialMedia.js';

interface MoreProps extends Omit<MenuProps<'div'>, 'className'> {
    channel: Channel;
    className?: string;
}

export const ChannelMoreAction = memo<MoreProps>(function ChannelMoreAction({ channel }) {
    const isLogin = useIsLoginFirefly();
    const [{ loading: channelBlocking }, toggleBlockChannel] = useToggleMutedChannel();

    return (
        <MoreActionMenu
            source={channel.source}
            button={
                channelBlocking ? (
                    <span className="inline-flex size-8 animate-spin items-center justify-center">
                        <LoadingIcon size={16} />
                    </span>
                ) : (
                    <span className="border-lightLineSecond inline-flex size-8 items-center justify-center rounded-lg border">
                        <MoreIcon width={21} height={21} />
                    </span>
                )
            }
        >
            <MenuGroup>
                <MenuItem>{({ close }) => <CopyLinkButton link={getChannelUrl(channel)} onClick={close} />}</MenuItem>
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
