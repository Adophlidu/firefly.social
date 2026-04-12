'use client';

import { Trans } from '@lingui/react/macro';
import { memo } from 'react';

import { ToggleMutedButton } from '@/components/Actions/ToggleMutedButton.js';
import type { ClickableButtonProps } from '@/components/ClickableButton.js';
import { useToggleMutedProfile } from '@/hooks/useToggleMutedProfile.js';
import { ConfirmModalRef } from '@/modals/ConfirmModal/refs.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

interface Props extends Omit<ClickableButtonProps, 'children'> {
    profile: Profile;
    variant?: 'text' | 'icon';
    muted?: boolean;
}

export const ToggleMutedProfileButton = memo(function ToggleMutedProfileButton({ profile, muted, ...rest }: Props) {
    const isMuted = muted ?? profile.viewerContext?.blocking ?? true;

    const [{ loading }, toggleMuted] = useToggleMutedProfile(profile.source);

    const onToggle = async () => {
        if (!isMuted) {
            const confirmed = await ConfirmModalRef.openAndWaitForClose({
                title: <Trans>Mute @{profile.handle}</Trans>,
                content: (
                    <div className="text-main">
                        <Trans>Confirm you want to mute @{profile.handle}?</Trans>
                    </div>
                ),
            });
            if (!confirmed) return;
        }
        return toggleMuted(profile, isMuted);
    };

    return <ToggleMutedButton {...rest} isMuted={isMuted} loading={loading} onClick={onToggle} />;
});
