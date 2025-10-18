import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { useRouter } from '@tanstack/react-router';
import { ConnectorNotConnectedError } from '@wagmi/core';
import { type HTMLProps, useState } from 'react';
import { useAsyncFn, useMount, useUnmount } from 'react-use';
import { useCountdown } from 'usehooks-ts';
import { UserRejectedRequestError } from 'viem';

import { ClickableButton } from '@/components/ClickableButton.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { ScannableQRCode } from '@/components/ScannableQRCode.js';
import { IS_MOBILE_DEVICE } from '@/constants/browser.js';
import { FarcasterSignType, FarcasterSignType as SignType, Source } from '@/constants/enum.js';
import {
    AbortError,
    FarcasterPatchSignerError,
    FireflyAccountAbsentError,
    FireflyAlreadyBoundError,
    FireflyBindTimeoutError,
    NotAllowedError,
    TimeoutError,
} from '@/constants/error.js';
import { FARCASTER_REPLY_COUNTDOWN } from '@/constants/index.js';
import { classNames } from '@/helpers/classNames.js';
import {
    enqueueInfoMessage,
    enqueueMessageFromError,
    enqueueSuccessMessage,
    enqueueWarningMessage,
} from '@/helpers/enqueueMessage.js';
import { resolveSourceName } from '@/helpers/resolveSourceName.js';
import { safeUnreachable } from '@/helpers/unreachable.js';
import { useAbortController } from '@/hooks/useAbortController.js';
import { DraggablePopoverRef } from '@/modals/DraggablePopover.js';
import { LoginModalRef } from '@/modals/LoginModal/index.js';
import type { Account } from '@/providers/types/Account.js';
import { createAccountByFireflySponsorship } from '@/providers/warpcast/createAccountByFireflySponsorship.js';
import { createAccountByGrantPermission } from '@/providers/warpcast/createAccountByGrantPermission.js';
import { createAccountByRelayService } from '@/providers/warpcast/createAccountByRelayService.js';
import { createAccountByWallet } from '@/providers/warpcast/createAccountByWallet.js';
import { type AccountOptions, addAccount } from '@/services/account.js';

async function login(createAccount: () => Promise<Account>, options?: Omit<AccountOptions, 'source'>) {
    try {
        const account = await createAccount();

        const done = await addAccount(account, options);
        if (done)
            enqueueSuccessMessage(<Trans>Your {resolveSourceName(Source.Farcaster)} account is now connected.</Trans>);

        LoginModalRef.close();
        DraggablePopoverRef.close();
    } catch (error) {
        // ignore cancel connect wallet error
        if (error instanceof ConnectorNotConnectedError) return;

        // skip if the error is abort error
        if (AbortError.is(error)) return;

        // if login timed out, let the user refresh the QR code
        if (error instanceof TimeoutError || error instanceof FireflyBindTimeoutError) {
            enqueueWarningMessage(<Trans>This QR code is longer valid. Please scan a new one to continue.</Trans>);
            return;
        }

        // user rejected request
        if (error instanceof UserRejectedRequestError) return;

        // failed to patch the signer
        if (error instanceof FarcasterPatchSignerError) throw error;

        // if any error occurs, close the modal
        // by this we don't need to do error handling in UI part.
        LoginModalRef.close();
        DraggablePopoverRef.close();
        // if the account is already bound to another account, show a warning message
        if (error instanceof FireflyAlreadyBoundError) {
            enqueueWarningMessage(
                t`The account you are trying to log in with is already linked to a different Firefly account.`,
            );
            return;
        }

        throw error;
    }
}

function LoginFarcasterWithWalletButton({ children, className }: HTMLProps<'a'>) {
    const controller = useAbortController();
    const [{ loading }, onLoginByConnectWallet] = useAsyncFn(async () => {
        controller.current.renew();
        try {
            await login(() => createAccountByWallet(controller.current.signal));
        } catch (error) {
            if (error instanceof FireflyAccountAbsentError) {
                enqueueWarningMessage(
                    <Trans>Registered account not found. Please switch to another wallet and try again.</Trans>,
                );
            } else if (error instanceof FireflyAlreadyBoundError) {
                enqueueWarningMessage(
                    t`The account you are trying to log in with is already linked to a different Firefly account.`,
                );
            } else {
                enqueueMessageFromError(error, <Trans>Failed to login.</Trans>);
            }
            throw error;
        }
    }, [controller]);

    return (
        <button
            type="button"
            className={classNames(
                'relative text-highlight hover:underline',
                loading ? 'cursor-wait' : 'cursor-pointer',
                className,
            )}
            onClick={onLoginByConnectWallet}
            disabled={loading}
        >
            <span
                className={classNames({
                    'opacity-50': loading,
                })}
            >
                {children}
            </span>
            {loading ? (
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                    <LoadingIcon size={16} />
                </span>
            ) : null}
        </button>
    );
}

interface LoginFarcasterProps {
    signType: SignType | null;
}

export function LoginFarcaster({ signType }: LoginFarcasterProps) {
    const controller = useAbortController();

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

    const [{ loading: loadingByGrantPermission }, onLoginByGrantPermission] = useAsyncFn(async () => {
        controller.current.renew();
        try {
            await login(
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
                { skipReportFarcasterSigner: false, signal: controller.current.signal },
            );
        } catch (error) {
            enqueueMessageFromError(error, <Trans>Failed to login.</Trans>);
            throw error;
        }
    }, [controller, resetCountdown, startCountdown, stopCountdown]);

    const [{ loading: loadingByRelayService }, onLoginByRelayService] = useAsyncFn(async () => {
        controller.current.renew();

        try {
            await login(
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
                { signal: controller.current.signal },
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
    }, [controller, history, resetCountdown, startCountdown, stopCountdown]);

    const [{ loading: loadingBySponsorship }, onLoginByFireflySponsorship] = useAsyncFn(async () => {
        controller.current.renew();
        try {
            await login(
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
                { skipReportFarcasterSigner: false, signal: controller.current.signal },
            );
        } catch (error) {
            enqueueMessageFromError(error, <Trans>Failed to login.</Trans>);
            throw error;
        }
    }, [controller, resetCountdown, startCountdown, stopCountdown]);

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
                            >
                                <Trans>New Connect</Trans>
                            </ClickableButton>
                            <ClickableButton
                                onClick={() => {
                                    onClick(FarcasterSignType.RelayService);
                                    DraggablePopoverRef.close();
                                }}
                                className="font-bol flex flex-1 items-center justify-center rounded-full bg-main py-2 text-primaryBottom"
                            >
                                <Trans>Reconnect</Trans>
                            </ClickableButton>
                        </div>
                    </div>
                ),
            });
        }
        onClick(signType);
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
                                            onClick={() =>
                                                history.replace(
                                                    `/farcaster?signType=${FarcasterSignType.FireflySponsorship}`,
                                                )
                                            }
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
                                        onClick={() => history.replace(`/farcaster?signType=${SignType.RelayService}`)}
                                        className="inline text-highlight hover:underline"
                                    >
                                        <Trans>Already signed in before?</Trans>
                                    </button>
                                ) : signType === SignType.RelayService ? (
                                    <Trans>
                                        <LoginFarcasterWithWalletButton>Connect wallet</LoginFarcasterWithWalletButton>{' '}
                                        to sign in
                                        <br />
                                        if you registered your Farcaster account on Firefly
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
