import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { delay } from '@masknet/kit';
import { rootRouteId, useRouteContext } from '@tanstack/react-router';
import { useCallback } from 'react';
import { useAsyncFn } from 'react-use';

import InfoIcon from '@/assets/info.svg';
import { Avatar } from '@/components/Avatar.js';
import { CircleCheckboxIcon } from '@/components/CircleCheckboxIcon.js';
import { ClickableButton } from '@/components/ClickableButton.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { SocialSourceIcon } from '@/components/SocialSourceIcon.js';
import { Tooltip } from '@/components/Tooltip.js';
import { RestrictionType, type SocialSource, Source } from '@/constants/enum.js';
import { ENABLED_REPLY_SETTINGS_POST_SOURCES } from '@/constants/index.js';
import { classNames } from '@/helpers/classNames.js';
import { enqueueErrorMessage, enqueueMessageFromError, enqueueSuccessMessage } from '@/helpers/enqueueMessage.js';
import { isSameProfile } from '@/helpers/isSameProfile.js';
import { resolveSourceName } from '@/helpers/resolveSourceName.js';
import { useAccounts } from '@/hooks/useAccounts.js';
import { useCompositePost } from '@/hooks/useCompositePost.js';
import { useCurrentProfile } from '@/hooks/useCurrentProfile.js';
import { CloseAction } from '@/modals/ComposeModal.js';
import { ComposeModalRef, LoginModalRef } from '@/modals/controls.js';
import type { Account } from '@/providers/types/Account.js';
import type { Profile } from '@/providers/types/SocialMedia.js';
import { switchAccount } from '@/services/account.js';
import { useComposeStateStore } from '@/store/useComposeStore.js';

interface PostByItemProps {
    source: SocialSource;
    disabled?: boolean;
    reason?: string;
}

export function PostByItem({ source, disabled = false, reason }: PostByItemProps) {
    const routeContext = useRouteContext({ from: rootRouteId });
    const accounts = useAccounts(source);
    const currentProfile = useCurrentProfile(source);

    const { enableSource, disableSource, updateRestriction } = useComposeStateStore();
    const { availableSources, images } = useCompositePost();

    const [{ loading }, login] = useAsyncFn(async (account: Account) => {
        try {
            await switchAccount(account);
            enqueueSuccessMessage(t`Your ${resolveSourceName(account.profile.source)} account is now connected.`);
        } catch (error) {
            enqueueMessageFromError(error, t`Failed to login.`);
            throw error;
        }
    }, []);

    const toggleSource = useCallback(
        (profile: Profile) => {
            if (!isSameProfile(currentProfile, profile) || disabled || !currentProfile) return;
            if (availableSources.includes(currentProfile.source)) {
                disableSource(currentProfile.source);
            } else {
                enableSource(currentProfile.source);
                if (!ENABLED_REPLY_SETTINGS_POST_SOURCES.includes(currentProfile.source)) {
                    updateRestriction(RestrictionType.Everyone);
                }
            }
        },
        [availableSources, currentProfile, disabled, disableSource, enableSource, updateRestriction],
    );

    if (!currentProfile || !accounts?.length)
        return (
            <div className="shrink-0">
                <div className="box-content flex h-12 items-center justify-between px-3 hover:bg-bg">
                    <div className="flex items-center gap-2 text-main">
                        <SocialSourceIcon size={24} source={source} />
                        <span className="font-bold text-main">{resolveSourceName(source)}</span>
                    </div>

                    <ClickableButton
                        className="font-bold text-farcasterPrimary"
                        onClick={async () => {
                            if (source === Source.Farcaster && images.length > 2) {
                                enqueueErrorMessage(t`Only up to 2 images can be chosen.`);
                                return;
                            }

                            if (routeContext.onClose && typeof routeContext.onClose === 'function') {
                                const closeAction = await routeContext.onClose();
                                if (closeAction === CloseAction.None) return;
                            } else {
                                ComposeModalRef.close();
                            }
                            await delay(300);
                            LoginModalRef.open({
                                source,
                            });
                        }}
                    >
                        <Trans>Login</Trans>
                    </ClickableButton>
                </div>
            </div>
        );

    return accounts.map(({ profile, session }) => (
        <div className="shrink-0" key={profile.profileId} onClick={() => toggleSource(profile)}>
            <div
                className={classNames('box-content flex h-12 items-center justify-between px-3', {
                    'cursor-pointer hover:bg-bg': !disabled,
                    'cursor-not-allowed opacity-50': disabled && !reason,
                })}
            >
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Avatar src={profile.pfp} size={24} alt={profile.handle} />
                        <SocialSourceIcon
                            className="absolute -bottom-1 -right-1 z-10 rounded-full border border-white dark:border-gray-900"
                            source={profile.source}
                            size={12}
                        />
                    </div>
                    <span
                        className={classNames(
                            'font-bold',
                            isSameProfile(currentProfile, profile) ? 'text-main' : 'text-secondary',
                        )}
                    >
                        @{profile.handle}
                    </span>
                </div>
                {isSameProfile(currentProfile, profile) ? (
                    disabled && reason ? (
                        <Tooltip placement="top-end" content={reason}>
                            <InfoIcon width={20} height={20} className="cursor-pointer text-warn" />
                        </Tooltip>
                    ) : (
                        <CircleCheckboxIcon checked={availableSources.includes(currentProfile.source)} />
                    )
                ) : (
                    <ClickableButton
                        className="font-bold text-farcasterPrimary"
                        disabled={loading}
                        onClick={() => login({ profile, session })}
                    >
                        {loading ? <LoadingIcon /> : <Trans>Switch</Trans>}
                    </ClickableButton>
                )}
            </div>
        </div>
    ));
}
