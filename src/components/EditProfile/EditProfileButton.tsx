import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { useCallback, useState } from 'react';

import EditProfileIcon from '@/assets/edit-profile.svg';
import { ClickableButton, type ClickableButtonProps } from '@/components/ClickableButton.js';
import { EditProfileDialog } from '@/components/EditProfile/EditProfileDialog.js';
import { captureEditProfileClickEvent } from '@/providers/telemetry/captureProfileActionEvent.js';
import { type Profile } from '@/providers/types/SocialMedia.js';

interface EditProfileButtonProps extends Omit<ClickableButtonProps, 'children'> {
    variant?: 'text' | 'icon';
    profile: Profile;
}

export function EditProfileButton({ profile, variant = 'text', className, ref, ...props }: EditProfileButtonProps) {
    const [open, setOpen] = useState(false);
    const onClose = useCallback(() => setOpen(false), []);
    const children = {
        text: <Trans>Edit Profile</Trans>,
        icon: <EditProfileIcon className="size-4 shrink-0" />,
    }[variant];
    return (
        <>
            <EditProfileDialog open={open} onClose={onClose} profile={profile} />
            <ClickableButton
                {...props}
                onClick={() => {
                    setOpen(true);
                    captureEditProfileClickEvent();
                }}
                className={classNames(
                    'flex h-8 shrink-0 items-center justify-center whitespace-nowrap rounded-lg border border-lightMain px-5 text-medium font-bold leading-5 text-lightMain',
                    className,
                )}
            >
                {children}
            </ClickableButton>
        </>
    );
}
