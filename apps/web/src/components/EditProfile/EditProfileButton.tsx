'use client';

import EditProfileIcon from '@dimensiondev/assets/edit-profile.svg';
import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';

import { ClickableButton, type ClickableButtonProps } from '@/components/ClickableButton.js';
import { openEditProfileModal } from '@/helpers/openEditProfileModal.js';
import { captureEditProfileClickEvent } from '@/providers/telemetry/captureProfileActionEvent.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

interface EditProfileButtonProps extends Omit<ClickableButtonProps, 'children'> {
    variant?: 'text' | 'icon';
    profile: Profile;
}

export function EditProfileButton({ profile, variant = 'text', className, ref, ...props }: EditProfileButtonProps) {
    const children = {
        text: <Trans>Edit Profile</Trans>,
        icon: <EditProfileIcon className="size-4 shrink-0" />,
    }[variant];
    return (
        <ClickableButton
            {...props}
            onClick={() => {
                openEditProfileModal({ profile });
                captureEditProfileClickEvent();
            }}
            className={classNames(
                'flex h-8 shrink-0 items-center justify-center whitespace-nowrap rounded-lg border border-lightMain px-5 text-medium font-bold leading-5 text-lightMain',
                className,
            )}
        >
            {children}
        </ClickableButton>
    );
}
