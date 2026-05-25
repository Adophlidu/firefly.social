'use client';

import MuteIcon from '@dimensiondev/assets/mute.svg';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { memo } from 'react';

import { MenuButton } from '@/components/Actions/MenuButton.js';
import type { ClickableButtonProps } from '@/components/ClickableButton.js';
import { enqueueErrorMessage } from '@/helpers/enqueueMessage.js';
import { ConfirmModalRef } from '@/modals/ConfirmModal/refs.js';
import type { Channel } from '@/providers/types/SocialMedia.js';

interface Props extends Omit<ClickableButtonProps, 'children' | 'onToggle'> {
    channel: Channel;
    onToggle?(channel: Channel): Promise<boolean>;
}

export const MuteChannelButton = memo(function MuteChannelButton({ channel, ref, onToggle, onClick, ...rest }: Props) {
    const muted = channel.blocked;

    return (
        <MenuButton
            {...rest}
            onClick={async (event) => {
                onClick?.(event);
                const confirmed = !muted
                    ? await ConfirmModalRef.openAndWaitForClose({
                          title: muted ? <Trans>Unmute /{channel.id}</Trans> : <Trans>Mute /{channel.id}</Trans>,
                          content: (
                              <div className="text-main">
                                  <Trans>All posts from /{channel.id} will be hidden from you</Trans>
                              </div>
                          ),
                          variant: 'normal',
                      })
                    : true;

                if (!onToggle || !confirmed) return;
                const result = await onToggle(channel);
                if (result === false) {
                    enqueueErrorMessage(
                        muted ? t`Failed to unmute /${channel.id}.` : t`Failed to mute /${channel.id}.`,
                    );
                }
            }}
            ref={ref}
        >
            <MuteIcon width={18} height={18} />
            <span className="font-bold leading-[22px] text-main">
                {muted ? <Trans>Unmute /{channel.id}</Trans> : <Trans>Mute /{channel.id}</Trans>}
            </span>
        </MenuButton>
    );
});
