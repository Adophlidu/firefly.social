'use client';
import { classNames } from '@dimensiondev/utils';
import type { AccessToken, IdToken, RefreshToken } from '@lens-protocol/client';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { useState } from 'react';
import { useAsync, useAsyncRetry, useUnmount } from 'react-use';
import { useCountdown } from 'usehooks-ts';

import ReloadIcon from '@/assets/reload.svg';
import { ClickableArea } from '@/components/ClickableArea.js';
import { ClickableButton } from '@/components/ClickableButton.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { ScannableQRCode } from '@/components/ScannableQRCode.js';
import { Source } from '@/constants/enum.js';
import { AbortError, InvalidOrbPermissionError, InvalidResultError } from '@/constants/error.js';
import { ORB_REPLY_COUNTDOWN, SEVEN_DAYS } from '@/constants/index.js';
import { Link } from '@/esm/Link.js';
import { enqueueMessageFromError, enqueueSuccessMessage, enqueueWarningMessage } from '@/helpers/enqueueMessage.js';
import { resolveSourceName } from '@/helpers/resolveSourceName.js';
import { retry } from '@/helpers/retry.js';
import { useAbortController } from '@/hooks/useAbortController.js';
import { LoginModalRef } from '@/modals/LoginModal/index.js';
import { ensureLensResult } from '@/providers/lens/ensureLensResult.js';
import { updateCredentialsStorage } from '@/providers/lens/getLensCredentialsFromStorage.js';
import { LensSession } from '@/providers/lens/Session.js';
import { lensSessionHolder } from '@/providers/lens/SessionHolder.js';
import { LensSocialMediaProvider } from '@/providers/lens/SocialMedia.js';
import { initSignIn } from '@/providers/orb/initSignIn.js';
import { pollSignIn } from '@/providers/orb/pollSignIn.js';
import { getAccountPairs } from '@/providers/telemetry/captureAccountEvent.js';
import { TelemetryProvider } from '@/providers/telemetry/index.js';
import { EventId } from '@/providers/types/Telemetry.js';
import { addAccount } from '@/services/account.js';
import { bindOrRestoreFireflySession } from '@/services/bindOrRestoreFireflySession.js';

export const OrbViewBeforeLoad = () => {
    return {
        title: <Trans>Sign in with Orb App</Trans>,
    };
};

export function OrbView() {
    const controller = useAbortController();
    const [scanned, setScanned] = useState(false);
    const [pollError, setPollError] = useState<Error | null>(null);
    const [count, { startCountdown, stopCountdown, resetCountdown }] = useCountdown({
        countStart: ORB_REPLY_COUNTDOWN,
        intervalMs: 1000,
        countStop: 0,
        isIncrement: false,
    });
    const { loading: initSignInLoading, value: initSignInData, retry: retryInitSignIn } = useAsyncRetry(initSignIn, []);

    useAsync(async () => {
        try {
            controller.current.renew();
            if (!initSignInData) return;
            setPollError(null);
            resetCountdown();
            startCountdown();
            const result = await retry(
                async (signal) => {
                    const pollResult = await pollSignIn(initSignInData.secret, signal);

                    if (!pollResult.processed) throw new InvalidResultError();

                    return pollResult;
                },
                {
                    times: 20,
                    signal: controller.current.signal,
                },
            );

            stopCountdown();

            setScanned(true);

            const profile = await LensSocialMediaProvider.getProfileById(result.user_id);

            if (!profile.address) throw new Error(t`Failed to login profile by orb`);

            if (!result.accessToken) {
                throw new InvalidOrbPermissionError();
            }

            const session = new LensSession(
                profile.profileId,
                result.accessToken,
                Date.now(),
                Date.now() + SEVEN_DAYS,
                result.refreshToken || 'FAKE_LENS_REFRESH_TOKEN',
                profile.address,
            );

            const done = await addAccount(
                {
                    profile,
                    session,
                    fireflySession: await bindOrRestoreFireflySession(session, controller.current.signal),
                },
                {
                    signal: controller.current.signal,
                },
            );

            if (!done) return;
            updateCredentialsStorage({
                accessToken: result.accessToken as AccessToken,
                refreshToken: (result.refreshToken || 'FAKE_LENS_REFRESH_TOKEN') as RefreshToken,
                idToken: result.idToken as IdToken,
            });
            lensSessionHolder.resumeSession(session);

            const sessionClient = await ensureLensResult(lensSessionHolder.sdk.resumeSession());
            if (sessionClient) lensSessionHolder.setSessionClient(sessionClient);

            LoginModalRef.close();
            enqueueSuccessMessage(<Trans>Your {resolveSourceName(Source.Lens)} account is now connected</Trans>);
            TelemetryProvider.captureEvent(EventId.ORB_LOGIN_IN_SUCCESS, {
                lens_accounts: getAccountPairs(Source.Lens),
            });
        } catch (error) {
            if (error instanceof AbortError) return;
            if (error instanceof InvalidResultError) {
                enqueueWarningMessage(
                    <Trans>This QR code is no longer valid. Please scan a new one to continue.</Trans>,
                );
                setPollError(error);
                return;
            }
            if (error instanceof InvalidOrbPermissionError) {
                enqueueWarningMessage(<Trans>Sorry, give edit permission from Orb is necessary to continue.</Trans>);
                setPollError(error);
                throw error;
            }

            enqueueMessageFromError(error, <Trans>Failed to login lens with orb</Trans>);
            setPollError(error as Error);
            throw error;
        } finally {
            setScanned(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initSignInData]);

    useUnmount(() => {
        stopCountdown();
        controller.current.abort();
    });

    return (
        <div className="box-border flex flex-col rounded-xl p-6 pt-0 md:w-[500px]">
            <div className="text-center text-xs leading-4 text-second">
                <Trans>
                    Scan the QR code with the <span className="font-bold">Camera app</span> <br />
                    and give <span className="font-bold">edit permission</span> to sign in instantly
                </Trans>
            </div>
            <ClickableArea
                disabled={scanned || initSignInLoading || !initSignInData}
                className={classNames('relative mt-6 flex items-center justify-center', {
                    'cursor-pointer': !scanned,
                })}
                onClick={() => {
                    controller.current.abort();

                    retryInitSignIn();
                }}
            >
                {initSignInLoading || !initSignInData ? (
                    <div className="flex size-[270px] items-center justify-center">
                        {initSignInLoading ? (
                            <LoadingIcon size={26} />
                        ) : (
                            <ClickableButton onClick={retryInitSignIn}>
                                <ReloadIcon width={36} height={36} />
                            </ClickableButton>
                        )}
                    </div>
                ) : (
                    <ScannableQRCode
                        size={238}
                        url={initSignInData.deepLink}
                        scanned={scanned}
                        countdown={count}
                        showReload={!!pollError}
                    />
                )}
                {scanned ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <LoadingIcon />
                    </div>
                ) : null}
            </ClickableArea>
            <div className="mt-4 text-center text-xs leading-4 text-second">
                <Trans>Powered by</Trans>
                <Link href="https://orb.club/" className="mx-[2px] font-bold text-highlight">
                    Orb
                </Link>
            </div>
        </div>
    );
}
