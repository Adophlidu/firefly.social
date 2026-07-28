'use client';

import TipsIcon from '@dimensiondev/assets/tips.svg';
import { Source, STATUS } from '@dimensiondev/enums';
import { envs } from '@dimensiondev/envs/web';
import { classNames } from '@dimensiondev/utils';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { motion } from 'framer-motion';
import type { HTMLProps } from 'react';
import { useAsyncFn } from 'react-use';

import { ClickableArea } from '@/components/ClickableArea.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { Tooltip } from '@/components/Tooltip.js';
import { queryClient } from '@/configs/queryClient.js';
import { STALE_TIMES } from '@/constants/query.js';
import { openLoginModalWithGuard } from '@/controllers/openLoginModal.js';
import { openTipsModal } from '@/controllers/openTipsModal.js';
import { enqueueErrorMessage, enqueueWarningMessage } from '@/helpers/enqueueMessage.js';
import { formatFireflyProfilesFromWalletProfiles } from '@/helpers/formatFireflyProfilesFromWalletProfiles.js';
import { isSameFireflyIdentity } from '@/helpers/isSameFireflyIdentity.js';
import { useCurrentFireflyProfilesAll } from '@/hooks/useCurrentFireflyProfiles.js';
import { useIsLoginFirefly } from '@/hooks/useIsLoginFirefly.js';
import type { TipsSuccessResult } from '@/modals/TipsModal/refs.js';
import { getAllPlatformProfileFromFirefly } from '@/providers/firefly/endpoint/getAllPlatformProfileFromFirefly.js';
import type { FireflyIdentity } from '@/providers/types/Firefly.js';
import type { Post } from '@/providers/types/SocialMedia.js';

interface TipsProps extends HTMLProps<HTMLButtonElement> {
    identity: FireflyIdentity;
    disabled?: boolean;
    isAuthRequired?: boolean;
    handle?: string | null;
    label?: string;
    toolbar?: boolean;
    tooltipDisabled?: boolean;
    pureWallet?: boolean;
    post?: Post;
    closeOnSuccess?: boolean;
    onClick?: () => void;
    onSuccess?: (result: TipsSuccessResult) => Promise<void> | void;
}

export function Tips({
    identity,
    disabled = false,
    isAuthRequired = true,
    label,
    toolbar = false,
    tooltipDisabled = false,
    pureWallet = false,
    handle = '',
    post,
    closeOnSuccess = false,
    className,
    ref,
    onClick,
    onSuccess,
}: TipsProps) {
    const isLogin = useIsLoginFirefly();
    const profiles = useCurrentFireflyProfilesAll();

    const [{ loading }, handleClick] = useAsyncFn(async () => {
        try {
            if (!isLogin) {
                openLoginModalWithGuard({ source: post?.source });
                return;
            }
            const fireflyProfiles = await queryClient.fetchQuery({
                queryKey: ['firefly-profile', identity.source, identity.id],
                staleTime: STALE_TIMES.MINUTE_10,

                queryFn: () => getAllPlatformProfileFromFirefly(identity, isAuthRequired),
            });
            const relatedProfiles = formatFireflyProfilesFromWalletProfiles(fireflyProfiles, {
                ignoreParticle: true,
            });
            if (!relatedProfiles?.some((profile) => profile.identity.source === Source.Wallet)) {
                const fireflyAccountName = fireflyProfiles.account?.displayName;
                const displayName = fireflyAccountName || (handle ? `@${handle}` : identity.id);
                enqueueWarningMessage(<Trans>Sorry, we are not able to find a wallet for {displayName}.</Trans>);
                return;
            }

            onClick?.();
            // Routed through the controller so the deferred AppModals cluster mounts
            // before the open event fires (see controllers/dispatchModalEvent.ts).
            openTipsModal({
                identity,
                handle,
                pureWallet,
                profiles: relatedProfiles,
                post,
                closeOnSuccess,
                onSuccess,
            });
        } catch (error) {
            enqueueErrorMessage(<Trans>Something went wrong, please try again.</Trans>, { error });
            throw error;
        }
    }, [identity, onClick, onSuccess, handle, pureWallet, post, closeOnSuccess, isLogin, isAuthRequired]);

    if (
        envs.external.NEXT_PUBLIC_TIPS !== STATUS.Enabled ||
        profiles.some((profile) => isSameFireflyIdentity(profile.identity, identity))
    )
        return null;

    return (
        <ClickableArea
            className={classNames('flex cursor-pointer items-center text-second md:space-x-2', className, {
                'opacity-50': disabled,
                'md:hover:text-lightWarn': !toolbar && !disabled && !label && !loading,
                'max-md:active:text-lightWarn': !toolbar && !disabled && !label && !loading,
                'w-min': !label,
            })}
        >
            <Tooltip
                content={<Trans>Send a tip</Trans>}
                placement="top"
                disabled={disabled || tooltipDisabled || loading}
            >
                <motion.button
                    className={classNames('inline-flex items-center', {
                        'md:hover:bg-lightWarn/[.20]': !toolbar && !disabled && !label && !loading,
                        'max-md:active:bg-lightWarn/[.20]': !toolbar && !disabled && !label && !loading,
                        'size-8 justify-center rounded-md hover:bg-line': toolbar,
                        'cursor-not-allowed': disabled,
                        'size-7 justify-center rounded-full': !toolbar && !label,
                        'w-full': !!label,
                    })}
                    whileTap={!toolbar && !label ? { scale: 0.9 } : undefined}
                    disabled={disabled || loading}
                    aria-label={label || t`Send a tip`}
                    ref={ref}
                    onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();

                        if (disabled) return;
                        handleClick();
                    }}
                >
                    {loading ? <LoadingIcon size={18} /> : <TipsIcon width={18} height={18} />}
                    {label ? <span className="ml-2 font-bold">{label}</span> : null}
                </motion.button>
            </Tooltip>
        </ClickableArea>
    );
}
