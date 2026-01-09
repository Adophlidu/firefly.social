import {
    AbortError,
    classNames,
    ForbiddenError,
    NotAllowedError,
    safeUnreachable,
    TimeoutError,
} from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { useRouter } from '@tanstack/react-router';
import { ConnectorNotConnectedError } from '@wagmi/core';
import { useState } from 'react';
import { useAsyncFn, useMount, useUnmount } from 'react-use';
import { useCountdown } from 'usehooks-ts';
import { UserRejectedRequestError } from 'viem';

import { ClickableButton } from '@/components/ClickableButton.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { SignupEntry } from '@/components/Profile/SignupEntry.js';
import { ScannableQRCode } from '@/components/ScannableQRCode.js';
import { IS_MOBILE_DEVICE } from '@/constants/browser.js';
import { AsyncStatus, FarcasterSignType, FarcasterSignType as SignType, Source, STATUS } from '@/constants/enum.js';
import { env } from '@/constants/env.js';
import {
    FarcasterPatchSignerError,
    FireflyAccountAbsentError,
    FireflyAlreadyBoundError,
    FireflyBindTimeoutError,
} from '@/constants/error.js';
import { FARCASTER_REPLY_COUNTDOWN } from '@/constants/static.js';
import {
    enqueueForbiddenMessage,
    enqueueInfoMessage,
    enqueueMessageFromError,
    enqueueSuccessMessage,
    enqueueWarningMessage,
} from '@/helpers/enqueueMessage.js';
import { resolveSourceName } from '@/helpers/resolveSourceName.js';
import { useAbortController } from '@/hooks/useAbortController.js';
import { useCanBindMoreAccount } from '@/hooks/useCanBindMoreAccount.js';
import { DraggablePopoverRef } from '@/modals/DraggablePopover.js';
import { LoginModalRef } from '@/modals/LoginModal/index.js';
import {
    captureFirstTimeClickInLogin,
    captureReconnectClickInLogin,
} from '@/providers/telemetry/captureFarcasterEvent.js';
import { type Account } from '@/providers/types/Account.js';
import { createAccountByFireflySponsorship } from '@/providers/warpcast/createAccountByFireflySponsorship.js';
import { createAccountByGrantPermission } from '@/providers/warpcast/createAccountByGrantPermission.js';
import { createAccountByRelayService } from '@/providers/warpcast/createAccountByRelayService.js';
import { type AccountOptions, addAccount } from '@/services/account.js';
import { useGlobalState } from '@/store/useGlobalStore.js';

async function loginFarcaster(
    createAccount: () => Promise<Account>,
    {
        setAsyncStatus,
        ...options
    }: Omit<AccountOptions, 'source'> & {
        setAsyncStatus: (source: Source.Farcaster, status: AsyncStatus) => void;
    },
) {
    try {
        const account = await createAccount();

        setAsyncStatus(Source.Farcaster, AsyncStatus.Pending);
        const done = await addAccount(account, options);
        if (done) {
            enqueueSuccessMessage(<Trans>Your {resolveSourceName(Source.Farcaster)} account is now connected.</Trans>);
        }

        LoginModalRef.close();
        DraggablePopoverRef.close();
    } catch (error) {
        // skip if the error is abort error
        if (AbortError.is(error)) return;

        // ignore cancel connect wallet error
        if (error instanceof ConnectorNotConnectedError) return;

        // user rejected request
        if (error instanceof UserRejectedRequestError) return;

        // if login timed out, let the user refresh the QR code
        if (error instanceof TimeoutError || error instanceof FireflyBindTimeoutError) {
            enqueueWarningMessage(<Trans>This QR code is longer valid. Please scan a new one to continue.</Trans>);
            return;
        }

        // if the user is forbidden to login, show a forbidden message
        if (error instanceof ForbiddenError) {
            enqueueForbiddenMessage();
            return;
        }

        // if the account is already bound to another account, show a warning message
        if (error instanceof FireflyAlreadyBoundError) {
            enqueueWarningMessage(
                <Trans>
                    The account you are trying to log in with is already linked to a different Firefly account.
                </Trans>,
            );
            return;
        }

        if (error instanceof FireflyAccountAbsentError) {
            enqueueWarningMessage(
                <Trans>Registered account not found. Please switch to another wallet and try again.</Trans>,
            );
            return;
        }

        // if any unhandled error occurs, close the modal
        // by this we don't need to do error handling in UI part.
        LoginModalRef.close();
        DraggablePopoverRef.close();

        throw error;
    } finally {
        setAsyncStatus(Source.Farcaster, AsyncStatus.Idle);
    }
}

interface LoginFarcasterProps {
    signType: SignType | null;
}

export function LoginFarcaster({ signType }: LoginFarcasterProps) {
    const controller = useAbortController();
    const { setAsyncStatus } = useGlobalState();

    const [url, setUrl] = useState('');
    const [scanned, setScanned] = useState(false);

    const router = useRouter();
    const { history } = router;

    const [count, { startCountdown, stopCountdown, resetCountdown }] = useCountdown({
        countStart: FARCASTER_REPLY_COUNTDOWN,
        intervalMs: 1000,
        countStop: 0,
        isIncrement: false,
    });

    const { data: canBindMoreAccount } = useCanBindMoreAccount(Source.Farcaster);

    const [{ loading: loadingByGrantPermission }, onLoginByGrantPermission] = useAsyncFn(async () => {
        controller.current.renew();

        try {
            await loginFarcaster(
                () => {
                    const account = createAccountByGrantPermission((url) => {
                        resetCountdown();
                        startCountdown();
                        setScanned(false);

                        if (IS_MOBILE_DEVICE) location.href = url;
                        else setUrl(url);
                    }, controller.current.signal);

                    setScanned(true);
                    stopCountdown();

                    return account;
                },
                {
                    setAsyncStatus,
                    skipReportFarcasterSigner: false,
                    signal: controller.current.signal,
                },
            );
        } catch (error) {
            enqueueMessageFromError(error, <Trans>Failed to login.</Trans>);
            throw error;
        }
    }, [controller, resetCountdown, startCountdown, stopCountdown, setAsyncStatus]);

    const [{ loading: loadingByRelayService }, onLoginByRelayService] = useAsyncFn(async () => {
        controller.current.renew();

        try {
            await loginFarcaster(
                async () => {
                    const account = await createAccountByRelayService((url) => {
                        resetCountdown();
                        startCountdown();
                        setScanned(false);

                        if (IS_MOBILE_DEVICE) location.href = url;
                        else setUrl(url);
                    }, controller.current.signal);

                    setScanned(true);
                    stopCountdown();

                    return account;
                },
                { setAsyncStatus, signal: controller.current.signal },
            );
        } catch (error) {
            if (error instanceof FarcasterPatchSignerError) {
                enqueueInfoMessage(
                    <Trans>Failed to reconnect. Please scan another QR code to establish a new connection.</Trans>,
                );
                history.replace(`/farcaster?signType=${FarcasterSignType.FireflySponsorship}`);
                return;
            }
            if (IS_MOBILE_DEVICE) {
                enqueueMessageFromError(error, <Trans>Failed to login.</Trans>);
                history.replace(`/farcaster?signType=${FarcasterSignType.FireflySponsorship}`);
                return;
            }
            enqueueMessageFromError(error, <Trans>Failed to login.</Trans>);
            throw error;
        }
    }, [controller, history, resetCountdown, startCountdown, stopCountdown, setAsyncStatus]);

    const [{ loading: loadingBySponsorship }, onLoginByFireflySponsorship] = useAsyncFn(async () => {
        controller.current.renew();

        try {
            await loginFarcaster(
                async () => {
                    const account = createAccountByFireflySponsorship((url) => {
                        resetCountdown();
                        startCountdown();
                        setScanned(false);

                        if (IS_MOBILE_DEVICE) location.href = url;
                        else setUrl(url);
                    }, controller.current.signal);

                    setScanned(true);
                    stopCountdown();

                    return account;
                },
                {
                    setAsyncStatus,
                    skipReportFarcasterSigner: false,
                    signal: controller.current.signal,
                },
            );
        } catch (error) {
            enqueueMessageFromError(error, <Trans>Failed to login.</Trans>);
            throw error;
        }
    }, [controller, resetCountdown, startCountdown, stopCountdown, setAsyncStatus]);

    const onClick = (signType: FarcasterSignType | null) => {
        if (!signType) return;

        switch (signType) {
            case SignType.GrantPermission:
                onLoginByGrantPermission();
                break;
            case SignType.RelayService:
                onLoginByRelayService();
                break;
            case SignType.FireflySponsorship:
                onLoginByFireflySponsorship();
                break;
            case SignType.RecoveryPhrase:
                throw new NotAllowedError();
            default:
                safeUnreachable(signType);
                break;
        }
    };

    useMount(() => {
        if (loadingByGrantPermission || loadingByRelayService || loadingBySponsorship) return;

        if (IS_MOBILE_DEVICE && !signType) {
            DraggablePopoverRef.open({
                content: (
                    <div className="p-6">
                        <div className="text-center text-[18px] font-bold leading-[22px] text-main">
                            <Trans>Sign in with Farcaster</Trans>
                        </div>
                        <div className="mt-8 text-center text-[14px] leading-[16px] text-second">
                            <Trans>
                                Reconnect if you’ve used Farcaster to sign in before.
                                <br />
                                First time? New connect to get started.
                            </Trans>
                        </div>
                        <div className="mt-8 flex gap-4">
                            <ClickableButton
                                onClick={() => {
                                    onClick(FarcasterSignType.FireflySponsorship);
                                    DraggablePopoverRef.close();
                                }}
                                className="flex flex-1 items-center justify-center rounded-full border border-lightMain py-2 font-bold text-fourMain"
                                aria-label="New Connect"
                            >
                                <Trans>New Connect</Trans>
                            </ClickableButton>
                            <ClickableButton
                                onClick={() => {
                                    onClick(FarcasterSignType.RelayService);
                                    DraggablePopoverRef.close();
                                }}
                                className="flex flex-1 items-center justify-center rounded-full bg-main py-2 font-bold text-primaryBottom"
                                aria-label="Reconnect"
                            >
                                <Trans>Reconnect</Trans>
                            </ClickableButton>
                        </div>
                    </div>
                ),
            });
        } else {
            onClick(signType);
        }
    });

    useUnmount(() => {
        if (IS_MOBILE_DEVICE) resetCountdown();
    });

    return (
        <div className="box-border flex flex-col rounded-xl p-6 pt-0 md:w-[500px]">
            {IS_MOBILE_DEVICE ? (
                <div className="flex min-h-[200px] w-full flex-col items-center justify-center gap-4">
                    {count !== 0 ? <LoadingIcon /> : null}
                    <div className="mt-2 text-center text-sm leading-[16px] text-second">
                        {count !== 0 ? (
                            <Trans>Please confirm the login with Farcaster.</Trans>
                        ) : (
                            <Trans>The connection has timed out. Please try again later.</Trans>
                        )}
                    </div>
                </div>
            ) : (
                <div className="flex w-full flex-col items-center gap-4">
                    {url ? (
                        <>
                            <div className="text-center text-xs leading-4 text-second">
                                {signType === SignType.GrantPermission ? (
                                    <Trans>
                                        Scan this QR code to establish a new connection via Farcaster for free.
                                    </Trans>
                                ) : signType === SignType.RelayService ? (
                                    <Trans>
                                        Scan this QR code if you’ve used Farcaster to sign in before.
                                        <br />
                                        <button
                                            onClick={() => {
                                                captureFirstTimeClickInLogin();
                                                history.replace(
                                                    `/farcaster?signType=${FarcasterSignType.FireflySponsorship}`,
                                                );
                                            }}
                                            className="inline text-highlight hover:underline"
                                        >
                                            First time
                                        </button>
                                        ? Go here to get started.
                                    </Trans>
                                ) : signType === SignType.FireflySponsorship ? (
                                    <Trans>
                                        Scan this QR code to establish a new connection via Farcaster for free.
                                    </Trans>
                                ) : null}
                            </div>
                            <div
                                className={classNames('relative flex items-center justify-center', {
                                    'cursor-pointer': !scanned,
                                })}
                                onClick={() => {
                                    if (scanned) return;
                                    controller.current.abort();
                                    resetCountdown();
                                    setUrl('');
                                    onClick(signType);
                                }}
                            >
                                <ScannableQRCode url={url} scanned={scanned} countdown={count} />
                                {scanned ? (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <LoadingIcon />
                                    </div>
                                ) : null}
                            </div>
                            <div className="text-center text-xs leading-4 text-second">
                                {signType === SignType.GrantPermission || signType === SignType.FireflySponsorship ? (
                                    <button
                                        onClick={() => {
                                            captureReconnectClickInLogin();
                                            history.replace(`/farcaster?signType=${SignType.RelayService}`);
                                        }}
                                        className="inline text-highlight hover:underline"
                                    >
                                        <Trans>Already signed in before?</Trans>
                                    </button>
                                ) : signType === SignType.RelayService &&
                                  canBindMoreAccount &&
                                  env.external.NEXT_PUBLIC_FARCASTER_SIGNUP === STATUS.Enabled ? (
                                    <Trans>
                                        No Farcaster account?{' '}
                                        <SignupEntry
                                            className="text-highlight"
                                            source={Source.Farcaster}
                                            onClick={() => LoginModalRef.close()}
                                        >
                                            Sign up
                                        </SignupEntry>{' '}
                                        on Firefly
                                    </Trans>
                                ) : null}
                            </div>
                        </>
                    ) : (
                        <div className="flex min-h-[200px] flex-col items-center justify-center">
                            <LoadingIcon />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
