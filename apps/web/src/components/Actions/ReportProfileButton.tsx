'use client';

import FlagIcon from '@dimensiondev/assets/flag.svg';
import { Trans } from '@lingui/react/macro';
import { useAsyncFn } from 'react-use';

import { MenuButton } from '@/components/Actions/MenuButton.js';
import type { ClickableButtonProps } from '@/components/ClickableButton.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { enqueueErrorMessage, enqueueMessageFromError, enqueueSuccessMessage } from '@/helpers/enqueueMessage.js';
import { openAndWaitForCloseConfirmModal } from '@/helpers/openConfirmModal.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

interface Props extends Omit<ClickableButtonProps, 'children'> {
    profile: Profile;
    onConfirm?(): void;
}

export function ReportProfileButton({ profile, ref, onConfirm, onClick, ...rest }: Props) {
    const [{ loading }, handleReport] = useAsyncFn(async () => {
        try {
            const provider = resolveSocialMediaProvider(profile.source);
            const result = await provider.reportProfile(profile.profileId);
            if (result) enqueueSuccessMessage(<Trans>Report submitted on {profile.source}</Trans>);
            else enqueueErrorMessage(<Trans>Failed to report @{profile.handle}</Trans>);
            return result;
        } catch (error) {
            enqueueMessageFromError(error, <Trans>Failed to report @{profile.handle}.</Trans>);
            throw error;
        }
    }, [profile]);

    return (
        <MenuButton
            {...rest}
            disabled={loading}
            onClick={async (event) => {
                onClick?.(event);
                const confirmed = await openAndWaitForCloseConfirmModal({
                    title: <Trans>Report @{profile.handle}</Trans>,
                    content: (
                        <div className="text-main">
                            <Trans>Are you sure you want to report this user?</Trans>
                        </div>
                    ),
                    variant: 'normal',
                });
                if (!confirmed) return;
                onConfirm?.();
                await handleReport();
            }}
            ref={ref}
        >
            {loading ? <LoadingIcon size={18} /> : <FlagIcon width={18} height={18} />}
            <span className="font-bold leading-[22px] text-main">
                <Trans>Report @{profile.handle}</Trans>
            </span>
        </MenuButton>
    );
}
