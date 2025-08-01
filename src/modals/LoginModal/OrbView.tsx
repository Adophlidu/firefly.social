'use client';
import type { AccessToken, IdToken, RefreshToken } from '@lens-protocol/client';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { useState } from 'react';
import { useAsync, useAsyncRetry } from 'react-use';
import { useCountdown } from 'usehooks-ts';

import { Link } from '@/components/Link.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { ScannableQRCode } from '@/components/ScannableQRCode.js';
import { Source } from '@/constants/enum.js';
import { InvalidOrbPermissionError, InvalidResultError } from '@/constants/error.js';
import { ORB_REPLY_COUNTDOWN, SEVEN_DAYS } from '@/constants/index.js';
import { classNames } from '@/helpers/classNames.js';
import { enqueueMessageFromError, enqueueSuccessMessage, enqueueWarningMessage } from '@/helpers/enqueueMessage.js';
import { resolveSourceName } from '@/helpers/resolveSourceName.js';
import { retry } from '@/helpers/retry.js';
import { useAbortController } from '@/hooks/useAbortController.js';
import { LoginModalRef } from '@/modals/controls.js';
import { ensureLensResult } from '@/providers/lens/ensureLensResult.js';
import { updateCredentialsStorage } from '@/providers/lens/getLensCredentialsFromStorage.js';
import { LensSession } from '@/providers/lens/Session.js';
import { lensSessionHolder } from '@/providers/lens/SessionHolder.js';
import { LensSocialMediaProvider } from '@/providers/lens/SocialMedia.js';
import { OrbProvider } from '@/providers/orb/index.js';
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
    const {
        loading: initSignInLoading,
        value: initSignInData,
        retry: retryInitSignIn,
    } = useAsyncRetry(async () => {
        return await OrbProvider.initSignIn();
    }, []);

    useAsync(async () => {
        try {
            controller.current.renew();
            if (!initSignInData) return;
            setPollError(null);
            resetCountdown();
            startCountdown();
            const result = await retry(
                async () => {
                    const pollResult = await OrbProvider.pollSignIn(initSignInData.secret);

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
                result.refreshToken || '',
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
                refreshToken: result.refreshToken as RefreshToken,
                idToken: result.idToken as IdToken,
            });
            lensSessionHolder.resumeSession(session);

            const sessionClient = await ensureLensResult(lensSessionHolder.sdk.resumeSession());
            if (sessionClient) lensSessionHolder.setSessionClient(sessionClient);

            LoginModalRef.close();
            enqueueSuccessMessage(t`Your ${resolveSourceName(Source.Lens)} account is now connected`);
            TelemetryProvider.captureEvent(EventId.ORB_LOGIN_IN_SUCCESS, {
                lens_accounts: getAccountPairs(Source.Lens),
            });
        } catch (error) {
            if (error instanceof InvalidResultError) {
                enqueueWarningMessage(t`This QR code is no longer valid. Please scan a new one to continue.`);
                setPollError(error);
                return;
            }
            if (error instanceof InvalidOrbPermissionError) {
                enqueueWarningMessage(t`Sorry, give edit permission from Orb is necessary to continue.`);
                setPollError(error);
                throw error;
            }

            enqueueMessageFromError(error, t`Failed to login lens with orb`);
            setPollError(error as Error);
            throw error;
        } finally {
            setScanned(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initSignInData]);

    return (
        <div className="box-border flex flex-col rounded-xl p-6 pt-0 md:w-[500px]">
            {!initSignInLoading && !!initSignInData ? (
                <>
                    <div className="text-center text-xs leading-4 text-second">
                        <Trans>
                            Scan the QR code with the <span className="font-bold">Camera app</span> and give
                            <span className="mx-1 font-bold">edit permission</span> to sign in instantly
                        </Trans>
                    </div>
                    <div
                        className={classNames('relative mt-6 flex items-center justify-center', {
                            'cursor-pointer': !scanned,
                        })}
                        onClick={() => {
                            if (scanned) return;
                            controller.current.abort();

                            retryInitSignIn();
                        }}
                    >
                        <ScannableQRCode
                            url={initSignInData.deepLink}
                            scanned={scanned}
                            countdown={count}
                            showReload={!!pollError}
                        />
                        {scanned ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <LoadingIcon />
                            </div>
                        ) : null}
                    </div>
                    <div className="mt-4 text-center text-xs leading-4 text-second">
                        <Trans>Powered by</Trans>
                        <Link href="https://orb.club/" className="mx-[2px] font-bold text-highlight">
                            Orb
                        </Link>
                    </div>
                </>
            ) : (
                <div className="flex min-h-[200px] flex-col items-center justify-center">
                    <LoadingIcon />
                </div>
            )}
        </div>
    );
}
