'use client';

import { lastLoggedInAccount } from '@lens-protocol/client/actions';
import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { useLocation, useRouter } from '@tanstack/react-router';
import { compact, first, uniqBy } from 'lodash-es';
import { memo, useState } from 'react';
import { useAsyncFn } from 'react-use';
import { useAccount } from 'wagmi';

import OrbIcon from '@/assets/orb.svg';
import ScanIcon from '@/assets/scan.svg';
import { CircleCheckboxIcon } from '@/components/CircleCheckboxIcon.js';
import { ClickableButton } from '@/components/ClickableButton.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { SignupEntry } from '@/components/Profile/SignupEntry.js';
import { ProfileAvatar } from '@/components/ProfileAvatar.js';
import { AsyncStatus, Source, STATUS } from '@/constants/enum.js';
import { env } from '@/constants/env.js';
import { AbortError, FireflyAlreadyBoundError, ForbiddenError } from '@/constants/error.js';
import { EMPTY_LIST } from '@/constants/index.js';
import {
    enqueueForbiddenMessage,
    enqueueMessageFromError,
    enqueueSuccessMessage,
    enqueueWarningMessage,
} from '@/helpers/enqueueMessage.js';
import { getProfileState } from '@/helpers/getProfileState.js';
import { isSameEthereumAddress } from '@/helpers/isSameAddress.js';
import { isSameProfile } from '@/helpers/isSameProfile.js';
import { resolveSourceName } from '@/helpers/resolveSourceName.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { useShouldSkipWaitMetrics } from '@/hooks/login/useShouldSkipWaitMetrics.js';
import { useAbortController } from '@/hooks/useAbortController.js';
import { useCanBindMoreAccount } from '@/hooks/useCanBindMoreAccount.js';
import { LoginModalRef } from '@/modals/LoginModal/index.js';
import { WalletConnectModalRef } from '@/modals/WalletConnectModal/index.js';
import { checkAndSyncMetrics } from '@/providers/firefly/metrics/checkAndSyncMetrics.js';
import { createAccountForProfileId } from '@/providers/lens/createAccountForProfileId.js';
import { ensureLensResult } from '@/providers/lens/ensureLensResult.js';
import { ensureLensResultSync } from '@/providers/lens/ensureLensResultSync.js';
import { updateCredentialsStorage } from '@/providers/lens/getLensCredentialsFromStorage.js';
import { lensSessionHolder } from '@/providers/lens/SessionHolder.js';
import { setPrivyAsLensManager } from '@/providers/lens/setPrivyAsLensManager.js';
import { LensSocialMediaProvider } from '@/providers/lens/SocialMedia.js';
import { TelemetryProvider } from '@/providers/telemetry/index.js';
import type { Profile } from '@/providers/types/SocialMedia.js';
import { EventId } from '@/providers/types/Telemetry.js';
import { addAccount } from '@/services/account.js';
import { useGlobalState } from '@/store/useGlobalStore.js';

export const LensViewBeforeLoad = () => {
    return {
        title: <Title />,
    };
};

function Title() {
    const account = useAccount();
    if (account.isReconnecting) return <Trans>Connecting Wallet</Trans>;
    return <Trans>Sign in with Lens</Trans>;
}

export const LensView = memo(function LensView() {
    const controller = useAbortController();
    const { setAsyncStatus } = useGlobalState();

    const router = useRouter();
    const { history } = router;

    const account = useAccount();
    const { data: canBindMoreAccount } = useCanBindMoreAccount(Source.Lens);
    const { expectedProfile } = useLocation().search as { expectedProfile?: string };
    const skipWaitForMetricsSyncing = useShouldSkipWaitMetrics();

    const [selectedProfile, setSelectedProfile] = useState<Profile>();

    const {
        data: profiles = EMPTY_LIST,
        isLoading,
        isRefetching,
    } = useQuery({
        retry: false,
        enabled: !!account.address,
        staleTime: 0,
        queryKey: ['lens', 'profiles', account.address],
        queryFn: async () => {
            try {
                if (!account.address) return EMPTY_LIST;

                const profiles = await LensSocialMediaProvider.getProfilesByAddress(account.address);
                const lastLoggedIn = await runInSafeAsync(() =>
                    ensureLensResult(lastLoggedInAccount(lensSessionHolder.sdk, { address: account.address })),
                );
                return uniqBy(
                    compact([
                        lastLoggedIn
                            ? profiles.find((x) => isSameEthereumAddress(x.profileId, lastLoggedIn.address))
                            : null,
                        ...(profiles || EMPTY_LIST),
                    ]),
                    (x) => x.profileId,
                );
            } catch (error) {
                enqueueMessageFromError(error, <Trans>Failed to fetch profiles.</Trans>);
                console.error('[login lens] Failed to fetch profiles', error);

                throw error;
            }
        },
        select: (profiles) => {
            if (!profiles) return EMPTY_LIST;
            const { accounts } = getProfileState(Source.Lens);
            const list = profiles.filter((x) => !accounts.some((y) => isSameProfile(x, y.profile)));
            if (expectedProfile) return list.sort((x) => (x.profileId === expectedProfile ? -1 : 0));
            return list;
        },
    });

    const currentProfile = selectedProfile || first(profiles);
    const isFetching = isLoading || isRefetching;

    const [{ loading }, login] = useAsyncFn(async () => {
        if (!profiles.length || !currentProfile) return;

        controller.current.renew();

        try {
            setAsyncStatus(Source.Lens, AsyncStatus.Pending);

            const { account, sessionClient } = await createAccountForProfileId(
                currentProfile,
                true,
                controller.current.signal,
            );

            const credentials = ensureLensResultSync(sessionClient.getCredentials());
            const done = await addAccount(account, {
                signal: controller.current.signal,
                skipSyncAccounts: true,
            });
            if (done) {
                // move to local storage
                if (credentials) {
                    updateCredentialsStorage(credentials);
                }
                lensSessionHolder.resumeSession(account.session);
                lensSessionHolder.setSessionClient(sessionClient);
                LoginModalRef.close();
                enqueueSuccessMessage(<Trans>Your {resolveSourceName(Source.Lens)} account is now connected.</Trans>);

                await runInSafeAsync(() => setPrivyAsLensManager(account));
                await checkAndSyncMetrics(account, skipWaitForMetricsSyncing);
            }
        } catch (error) {
            if (AbortError.is(error)) return;
            if (error instanceof ForbiddenError) {
                enqueueForbiddenMessage();
                return;
            }
            if (error instanceof FireflyAlreadyBoundError) {
                enqueueWarningMessage(<Trans>This wallet is already linked to a different Firefly account.</Trans>);
                return;
            }
            enqueueMessageFromError(error, <Trans>Failed to login.</Trans>);
            throw error;
        } finally {
            setAsyncStatus(Source.Lens, AsyncStatus.Idle);
        }
    }, [profiles.length, currentProfile, controller, skipWaitForMetricsSyncing, setAsyncStatus]);

    return (
        <div className="flex flex-col p-6 pt-0 md:w-[400px]">
            <div
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-lightHighlight p-2 max-md:hidden"
                onClick={() => {
                    history.replace('/orb');
                    TelemetryProvider.captureEvent(EventId.ORB_LOGIN_IN_CLICK, {});
                }}
            >
                <OrbIcon />
                <div className="flex flex-1 flex-col text-left text-[14px] leading-5 text-main">
                    <span>
                        <Trans>Orb Mobile</Trans>
                    </span>
                    <span className="text-second">
                        <Trans>Scan QR code to access your account</Trans>
                    </span>
                </div>
                <ScanIcon className="size-[20px]" />
            </div>
            <div className="my-3 px-2 text-center text-[14px] leading-[14px] max-md:hidden">
                {account.isConnected ? (
                    <Trans>
                        Or select an account from your
                        <span
                            className="ml-1 cursor-pointer text-highlight"
                            onClick={() => {
                                WalletConnectModalRef.open();
                            }}
                        >
                            current wallet
                        </span>
                    </Trans>
                ) : (
                    <Trans>OR</Trans>
                )}
            </div>

            {account.address ? (
                profiles.length > 0 ? (
                    <div className="no-scrollbar flex max-h-[278px] flex-col gap-2 overflow-auto max-md:max-h-[calc(100vh_-_136px)]">
                        {profiles.map((profile) => {
                            return (
                                <div
                                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-secondaryLine p-2"
                                    key={profile.profileId}
                                    onClick={() => {
                                        setSelectedProfile(profile);
                                    }}
                                >
                                    <ProfileAvatar
                                        profile={profile}
                                        size={40}
                                        enableDefaultAvatar
                                        enableSourceIcon={false}
                                    />

                                    <div className="flex flex-1 flex-col text-left text-[14px] leading-5">
                                        <span className="font-bold text-main">{profile.displayName}</span>
                                        <span className="text-second">@{profile.handle}</span>
                                    </div>
                                    <CircleCheckboxIcon checked={isSameProfile(currentProfile, profile)} />
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex h-[228px] flex-col items-center justify-center gap-1 text-[14px] leading-6 text-second max-md:max-h-[calc(100vh_-_136px)]">
                        {isFetching ? (
                            <LoadingIcon />
                        ) : (
                            <p>
                                <span>
                                    <Trans>No Lens profile found,</Trans>
                                </span>
                                <br />
                                {canBindMoreAccount && env.external.NEXT_PUBLIC_LENS_SIGNUP === STATUS.Enabled ? (
                                    <Trans>
                                        <ClickableButton
                                            className="mx-1 text-highlight"
                                            onClick={() => {
                                                WalletConnectModalRef.open();
                                            }}
                                        >
                                            change
                                        </ClickableButton>{' '}
                                        wallet or{' '}
                                        <SignupEntry
                                            className="text-highlight"
                                            source={Source.Lens}
                                            onClick={() => {
                                                LoginModalRef.close();
                                            }}
                                        >
                                            sign up
                                        </SignupEntry>{' '}
                                        on Firefly
                                    </Trans>
                                ) : (
                                    <span>
                                        <Trans>
                                            please{' '}
                                            <ClickableButton
                                                className="mx-1 text-highlight"
                                                onClick={() => {
                                                    WalletConnectModalRef.open();
                                                }}
                                            >
                                                change
                                            </ClickableButton>{' '}
                                            to another wallet.
                                        </Trans>
                                    </span>
                                )}
                            </p>
                        )}
                    </div>
                )
            ) : null}

            {account.address ? (
                <ClickableButton
                    disabled={!currentProfile || !profiles.length || isFetching}
                    loading={loading}
                    onClick={() => login()}
                    className="mt-2 flex h-10 w-full items-center justify-center rounded-lg bg-lightMain text-sm font-bold text-primaryBottom"
                >
                    {loading ? <Trans>Signing transaction</Trans> : <Trans>Sign to Confirm</Trans>}
                </ClickableButton>
            ) : (
                <ClickableButton
                    className="mt-2 flex h-10 w-full items-center justify-center rounded-lg bg-lightMain text-sm font-bold text-primaryBottom"
                    onClick={() => {
                        WalletConnectModalRef.open();
                    }}
                >
                    <Trans>Connect Wallet</Trans>
                </ClickableButton>
            )}
        </div>
    );
});
