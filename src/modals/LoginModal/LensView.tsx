'use client';

import { AbortError, ForbiddenError } from '@dimensiondev/utils';
import { lastLoggedInAccount } from '@lens-protocol/client/actions';
import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { useLocation, useRouter } from '@tanstack/react-router';
import { compact, first, uniqBy } from 'lodash-es';
import { memo, useState } from 'react';
import { useAsyncFn } from 'react-use';
import { useConnection } from 'wagmi';

import OrbIcon from '@/assets/orb.svg';
import ScanIcon from '@/assets/scan.svg';
import { CircleCheckboxIcon } from '@/components/CircleCheckboxIcon.js';
import { ClickableButton } from '@/components/ClickableButton.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { SignupEntry } from '@/components/Profile/SignupEntry.js';
import { ProfileAvatar } from '@/components/ProfileAvatar.js';
import { PRIVY_CONNECTOR_ID } from '@/connectors/PrivyConnector.js';
import { AsyncStatus, Source, STATUS } from '@/constants/enum.js';
import { env } from '@/constants/env.js';
import { FireflyAlreadyBoundError } from '@/constants/error.js';
import { EMPTY_LIST } from '@/constants/static.js';
import {
    enqueueForbiddenMessage,
    enqueueMessageFromError,
    enqueueSuccessMessage,
    enqueueWarningMessage,
} from '@/helpers/enqueueMessage.js';
import { getProfilesFromStorage } from '@/helpers/getCurrentProfileFromStorage.js';
import { isSameEthereumAddress } from '@/helpers/isSameAddress.js';
import { isSameProfile } from '@/helpers/isSameProfile.js';
import { resolveSourceName } from '@/helpers/resolveSourceName.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { useAbortController } from '@/hooks/useAbortController.js';
import { useCanBindMoreAccount } from '@/hooks/useCanBindMoreAccount.js';
import { logger } from '@/libs/Logger.js';
import { LoginModalRef } from '@/modals/LoginModal/index.js';
import { WalletConnectModalRef } from '@/modals/WalletConnectModal/index.js';
import { createAccountForProfileId } from '@/providers/lens/createAccountForProfileId.js';
import { ensureLensResult } from '@/providers/lens/ensureLensResult.js';
import { getProfilesByAddress } from '@/providers/lens/getProfilesByAddress.js';
import { lensClientHolder } from '@/providers/lens/LensClientHolder.js';
import { reLoginLensCurrentAccountWithPrivy } from '@/providers/lens/reLoginLensCurrentAccountWithPrivy.js';
import { lensSessionHolder } from '@/providers/lens/SessionHolder.js';
import { TelemetryProvider } from '@/providers/telemetry/index.js';
import { type Profile } from '@/providers/types/SocialMedia.js';
import { EventId } from '@/providers/types/Telemetry.js';
import { addAccount } from '@/services/account.js';
import { useGlobalState } from '@/store/useGlobalStore.js';

export const LensViewBeforeLoad = () => {
    return {
        title: <Title />,
    };
};

function Title() {
    const account = useConnection();
    if (account.isReconnecting) return <Trans>Connecting Wallet</Trans>;
    return <Trans>Sign in with Lens</Trans>;
}

export const LensView = memo(function LensView() {
    const controller = useAbortController();
    const { setAsyncStatus } = useGlobalState();
    const [frozenProfiles, setFrozenProfiles] = useState<Profile[]>();

    const router = useRouter();
    const { history } = router;

    const account = useConnection();
    const { data: canBindMoreAccount } = useCanBindMoreAccount(Source.Lens);
    const { expectedProfile } = useLocation().search as { expectedProfile?: string };

    const [selectedProfile, setSelectedProfile] = useState<Profile>();

    const {
        data: managedProfiles = EMPTY_LIST,
        isLoading,
        isRefetching,
    } = useQuery({
        retry: false,
        enabled: !!account.address,
        staleTime: 0,
        queryKey: ['lens', 'profiles', account.address?.toLowerCase()],
        queryFn: async () => {
            try {
                if (!account.address) return EMPTY_LIST;

                const profiles = await getProfilesByAddress(account.address);
                const lastLoggedIn = await runInSafeAsync(() =>
                    ensureLensResult(lastLoggedInAccount(lensClientHolder.client, { address: account.address })),
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
                logger.error('[login lens] Failed to fetch profiles', error);

                throw error;
            }
        },
        select: (profiles) => {
            if (!profiles) return EMPTY_LIST;
            const allProfiles = getProfilesFromStorage(Source.Lens);
            const list = profiles.filter((x) => !allProfiles.some((y) => isSameProfile(x, y)));
            if (expectedProfile) return list.sort((x) => (x.profileId === expectedProfile ? -1 : 0));
            return list;
        },
    });

    const profiles = frozenProfiles || managedProfiles;
    const currentProfile = selectedProfile || first(profiles);
    const isFetching = isLoading || isRefetching;
    const isPrivy = !!account.address && account.connector?.id === PRIVY_CONNECTOR_ID;

    const [{ loading }, login] = useAsyncFn(async () => {
        if (!currentProfile) return;

        controller.current.renew();
        setFrozenProfiles(managedProfiles);

        try {
            setAsyncStatus(Source.Lens, AsyncStatus.Pending);

            const { account } = await createAccountForProfileId(currentProfile, controller.current.signal);
            const done = await addAccount(account, {
                signal: controller.current.signal,
            });
            if (done) {
                await lensSessionHolder.resumeSession(account.session);
                LoginModalRef.close();
                enqueueSuccessMessage(<Trans>Your {resolveSourceName(Source.Lens)} account is now connected.</Trans>);

                // try re-login with privy if possible
                reLoginLensCurrentAccountWithPrivy(account);
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
            setFrozenProfiles(undefined);
        }
    }, [currentProfile, controller, managedProfiles, setAsyncStatus]);

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
                                {canBindMoreAccount &&
                                env.external.NEXT_PUBLIC_LENS_SIGNUP === STATUS.Enabled &&
                                !isPrivy ? (
                                    <Trans>
                                        <ClickableButton
                                            className="mx-1 text-highlight"
                                            onClick={() => {
                                                WalletConnectModalRef.open();
                                            }}
                                            aria-label="Change wallet"
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
                                                aria-label="Change wallet"
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
                    aria-label="Sign to Confirm"
                >
                    {loading ? <Trans>Signing to confirm</Trans> : <Trans>Sign to Confirm</Trans>}
                </ClickableButton>
            ) : (
                <ClickableButton
                    className="mt-2 flex h-10 w-full items-center justify-center rounded-lg bg-lightMain text-sm font-bold text-primaryBottom"
                    onClick={() => {
                        WalletConnectModalRef.open();
                    }}
                    aria-label="Connect Wallet"
                >
                    <Trans>Connect Wallet</Trans>
                </ClickableButton>
            )}
        </div>
    );
});
