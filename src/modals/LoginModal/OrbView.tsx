'use client';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { useState } from 'react';
import { useAsync, useAsyncRetry } from 'react-use';
import { useCountdown } from 'usehooks-ts';

import { Link } from '@/components/Link.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { ScannableQRCode } from '@/components/ScannableQRCode.js';
import { Source } from '@/constants/enum.js';
import { InvalidResultError } from '@/constants/error.js';
import { ORB_REPLY_COUNTDOWN, SEVEN_DAYS } from '@/constants/index.js';
import { classNames } from '@/helpers/classNames.js';
import { enqueueMessageFromError, enqueueSuccessMessage, enqueueWarningMessage } from '@/helpers/enqueueMessage.js';
import { getProfileState } from '@/helpers/getProfileState.js';
import { retry } from '@/helpers/retry.js';
import { useAbortController } from '@/hooks/useAbortController.js';
import { LoginModalRef } from '@/modals/controls.js';
import { LensSession } from '@/providers/lens/Session.js';
import { lensSessionHolder } from '@/providers/lens/SessionHolder.js';
import { LensSocialMediaProvider } from '@/providers/lens/SocialMedia.js';
import { OrbProvider } from '@/providers/orb/index.js';

export const OrbViewBeforeLoad = () => {
    return {
        title: <Trans>Sign in with Orb App</Trans>,
    };
};

export function OrbView() {
    const controller = useAbortController();
    const [scanned, setScanned] = useState(false);
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
            resetCountdown();
            startCountdown();
            const result = await retry(
                async () => {
                    const pollResult = await OrbProvider.pollSignIn(initSignInData.secret);

                    if (!pollResult.processed) throw new InvalidResultError();

                    return pollResult;
                },
                {
                    times: 30,
                    signal: controller.current.signal,
                },
            );

            stopCountdown();

            setScanned(true);

            const profile = await LensSocialMediaProvider.getProfileById(result.user_id);

            if (!profile.address) throw new Error(t`Failed to login profile by orb`);

            if (!result.accessToken || !result.refreshToken) {
                enqueueWarningMessage(t`Sorry, stay signed in & edit permission from Orb is necessary to continue.`);
                return;
            }

            const session = new LensSession(
                profile.profileId,
                result.accessToken,
                Date.now(),
                Date.now() + SEVEN_DAYS,
                result.refreshToken,
                profile.address,
            );

            await lensSessionHolder.resumeSession(session);
            const profileState = getProfileState(Source.Lens);
            profileState.addAccount(
                {
                    profile,
                    session,
                },
                true,
            );
            enqueueSuccessMessage(t`Your Lens account is now connected`);
            LoginModalRef.close();
        } catch (error) {
            if (error instanceof InvalidResultError) {
                enqueueWarningMessage(
                    t`Failed to query the orb sign in status after several attempts. Please try again later.`,
                );
                return;
            }
            enqueueMessageFromError(error, t`Failed to login lens with orb`);
            throw error;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initSignInData]);

    return (
        <div className="box-border flex flex-col rounded-xl p-6 pt-0 md:w-[500px]">
            {!initSignInLoading && !!initSignInData ? (
                <>
                    <div className="text-center text-xs leading-4 text-second">
                        <Trans>
                            Scan the QR code with the
                            <Link href="https://orb.club/" className="mx-[2px] text-highlight">
                                Orb mobile app
                            </Link>
                            <br />
                            or <span className="font-bold">Camera app</span> to sign in instantly
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
                        <ScannableQRCode url={initSignInData.deepLink} scanned={scanned} countdown={count} />
                        {scanned ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <LoadingIcon />
                            </div>
                        ) : null}
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
