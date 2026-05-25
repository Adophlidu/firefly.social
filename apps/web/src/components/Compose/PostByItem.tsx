'use client';

import InfoIcon from '@dimensiondev/assets/info.svg';
import { ENABLED_REPLY_SETTINGS_POST_SOURCES } from '@dimensiondev/constants/computed';
import type { SocialSource } from '@dimensiondev/enums';
import { RestrictionType, Source } from '@dimensiondev/enums';
import { classNames, delay } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { rootRouteId, useRouteContext } from '@tanstack/react-router';
import { useCallback } from 'react';
import { useAsyncFn } from 'react-use';

import { Avatar } from '@/components/Avatar.js';
import { CircleCheckboxIcon } from '@/components/CircleCheckboxIcon.js';
import { ClickableButton } from '@/components/ClickableButton.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { SocialSourceIcon } from '@/components/SocialSourceIcon.js';
import { Tooltip } from '@/components/Tooltip.js';
import { SessionExpiredError } from '@/constants/error.js';
import { enqueueErrorMessage, enqueueMessageFromError, enqueueSuccessMessage } from '@/helpers/enqueueMessage.js';
import { isSameProfile } from '@/helpers/isSameProfile.js';
import { openLoginModal } from '@/helpers/openLoginModal.js';
import { resolveSourceName } from '@/helpers/resolveSourceName.js';
import { useAccounts } from '@/hooks/useAccounts.js';
import { useCompositePost } from '@/hooks/useCompositePost.js';
import { useCurrentProfile } from '@/hooks/useCurrentProfile.js';
import { CloseAction, ComposeModalRef } from '@/modals/ComposeModal/refs.js';
import { captureShareToChangeClickEvent } from '@/providers/telemetry/captureClickEvent.js';
import type { Account } from '@/providers/types/Account.js';
import type { Profile } from '@/providers/types/SocialMedia.js';
import { switchAccount } from '@/services/account.js';
import { postFeatures } from '@/settings/post.js';
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

    const { type, sealedSource, enableSource, disableSource, updateRestriction, toggleAnonymous } =
        useComposeStateStore();
    const { availableSources, images, isAnonymous } = useCompositePost();

    const [{ loading }, login] = useAsyncFn(
        async (account: Account) => {
            try {
                await switchAccount(account);
                if (!availableSources.includes(account.profile.source)) {
                    enableSource(account.profile.source);
                }
                enqueueSuccessMessage(
                    <Trans>Your {resolveSourceName(account.profile.source)} account is now connected.</Trans>,
                );
            } catch (error) {
                if (error instanceof SessionExpiredError) return;

                enqueueMessageFromError(error, <Trans>Failed to sign in.</Trans>);
                throw error;
            }
        },
        [availableSources, enableSource],
    );

    const toggleSource = useCallback(
        (profile: Profile) => {
            if (!isSameProfile(currentProfile, profile) || disabled || !currentProfile) return;
            if (availableSources.includes(currentProfile.source) && !isAnonymous) {
                disableSource(currentProfile.source);
            } else {
                if (isAnonymous) {
                    availableSources.forEach((x) => {
                        if (x !== currentProfile.source) {
                            disableSource(x);
                        }
                    });
                }
                enableSource(currentProfile.source);
                toggleAnonymous(false);
                if (!ENABLED_REPLY_SETTINGS_POST_SOURCES.includes(currentProfile.source)) {
                    updateRestriction(RestrictionType.Everyone);
                }
            }
            captureShareToChangeClickEvent();
        },
        [
            availableSources,
            currentProfile,
            disabled,
            isAnonymous,
            disableSource,
            enableSource,
            updateRestriction,
            toggleAnonymous,
        ],
    );

    const signInDisabled =
        type !== 'compose' && !!sealedSource && source !== sealedSource && postFeatures.anonymousPost(sealedSource);

    if (!currentProfile || !accounts?.length)
        return (
            <ClickableButton
                className="w-full shrink-0"
                disabled={signInDisabled}
                onClick={async () => {
                    if (source === Source.Farcaster && images.length > 2) {
                        enqueueErrorMessage(<Trans>Only up to 2 images can be chosen.</Trans>);
                        return;
                    }

                    if (routeContext.onClose && typeof routeContext.onClose === 'function') {
                        const closeAction = await routeContext.onClose();
                        if (closeAction === CloseAction.None) return;
                    } else {
                        ComposeModalRef.close();
                    }
                    await delay(300);
                    openLoginModal({
                        source,
                    });
                }}
            >
                <div
                    className={classNames(
                        'box-content flex h-8 items-center justify-between px-3',
                        signInDisabled ? '' : 'hover:bg-bg',
                    )}
                >
                    <div className="flex items-center gap-2 text-main">
                        <SocialSourceIcon size={24} source={source} />
                        <span className={classNames('font-bold', signInDisabled ? 'text-secondary' : 'text-main')}>
                            {resolveSourceName(source)}
                        </span>
                    </div>

                    <span className="font-bold text-highlight">
                        <Trans>Sign In</Trans>
                    </span>
                </div>
            </ClickableButton>
        );

    return accounts.map(({ profile, session }) => {
        const checked = availableSources.includes(currentProfile.source) && !isAnonymous;

        return (
            <div className="shrink-0" key={profile.profileId} onClick={() => toggleSource(profile)}>
                <div
                    className={classNames('box-content flex h-8 items-center justify-between px-3', {
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
                        <span className={classNames(checked ? 'text-main' : 'text-secondary')}>@{profile.handle}</span>
                    </div>
                    {isSameProfile(currentProfile, profile) ? (
                        disabled && reason ? (
                            <Tooltip placement="top" content={reason}>
                                <InfoIcon width={22} height={22} className="cursor-pointer text-second" />
                            </Tooltip>
                        ) : (
                            <CircleCheckboxIcon size={18} checked={checked} />
                        )
                    ) : (
                        <ClickableButton
                            className="font-bold text-highlight"
                            disabled={loading}
                            onClick={() => login({ profile, session })}
                        >
                            {loading ? <LoadingIcon /> : <Trans>Switch</Trans>}
                        </ClickableButton>
                    )}
                </div>
            </div>
        );
    });
}
