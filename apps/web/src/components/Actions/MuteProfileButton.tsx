'use client';

import MuteIcon from '@dimensiondev/assets/mute.svg';
import UnmuteIcon from '@dimensiondev/assets/unmute.svg';
import { Trans } from '@lingui/react/macro';

import { MenuButton } from '@/components/Actions/MenuButton.js';
import type { ClickableButtonProps } from '@/components/ClickableButton.js';
import { openAndWaitForCloseConfirmModal } from '@/controllers/openConfirmModal.js';
import { useIsProfileMuted } from '@/hooks/useIsProfileMuted.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

interface MuteProfileButtonProps extends Omit<ClickableButtonProps, 'children' | 'onToggle'> {
    profile: Profile;
    onConfirm?(): void;
    onToggle?(profile: Profile): Promise<boolean>;
}

export function MuteProfileButton({ profile, ref, onConfirm, onToggle, onClick, ...rest }: MuteProfileButtonProps) {
    const blocking = profile.viewerContext?.blocking;
    const muted = useIsProfileMuted(profile.source, profile.profileId, blocking, blocking === undefined);

    return (
        <MenuButton
            {...rest}
            onClick={async (event) => {
                onClick?.(event);
                if (!muted) {
                    const confirmed = await openAndWaitForCloseConfirmModal({
                        title: <Trans>Mute @{profile.handle}</Trans>,
                        variant: 'normal',
                        content: (
                            <div className="text-main">
                                <Trans>All posts from @{profile.handle} will be hidden from you</Trans>
                            </div>
                        ),
                    });
                    if (!confirmed) return;
                    onConfirm?.();
                }
                await onToggle?.(profile);
            }}
            ref={ref}
        >
            {muted ? <UnmuteIcon width={18} height={18} /> : <MuteIcon width={18} height={18} />}
            <span className="font-bold leading-[22px] text-main">
                {muted ? <Trans>Unmute @{profile.handle}</Trans> : <Trans>Mute @{profile.handle}</Trans>}
            </span>
        </MenuButton>
    );
}
