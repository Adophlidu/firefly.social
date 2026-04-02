'use client';

import { AbortError, delay, ForbiddenError } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import dayjs from 'dayjs';
import { useSearchParams } from 'next/navigation.js';
import { useMemo } from 'react';
import { useAsync } from 'react-use';

import FullLogo from '@/assets/logo-full.svg';
import { Loading } from '@/components/Loading.js';
import { OpenFireflyAppButton } from '@/components/OpenFireflyAppButton.js';
import { Source } from '@/constants/enum.js';
import { FireflyAlreadyBoundError } from '@/constants/error.js';
import { useRouter } from '@/esm/navigation.js';
import { createDummyProfileFromThirdPartySession } from '@/helpers/createDummyProfile.js';
import {
    enqueueForbiddenMessage,
    enqueueMessageFromError,
    enqueueSuccessMessage,
    enqueueWarningMessage,
} from '@/helpers/enqueueMessage.js';
import { isSameSession } from '@/helpers/isSameSession.js';
import { ThirdPartySession } from '@/providers/third-party/Session.js';
import { SessionType } from '@/providers/types/SocialMedia.js';
import { addAccount } from '@/services/account.js';
import { bindOrRestoreFireflySession } from '@/services/bindOrRestoreFireflySession.js';
import { useThirdPartyProfileStore } from '@/store/useProfileStore/useThirdPartyProfileStore.js';
import { DeviceType } from '@/types/device.js';

export default function Page() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const os = searchParams.get('os') || undefined;
    const token = searchParams.get('token') || undefined;
    const schemes = useMemo(() => {
        if (!token) return;
        return {
            [DeviceType.IOS]: `firefly://authentication/telegram/callback?token=${token}`,
            [DeviceType.Android]: `firefly://authentication/telegram/callback?token=${token}`,
        };
    }, [token]);

    useAsync(async () => {
        if (os !== 'web' || !token) return;

        try {
            const session = new ThirdPartySession(
                SessionType.Telegram,
                '',
                token,
                Date.now(),
                dayjs(Date.now()).add(1, 'y').unix(),
            );

            const accounts = useThirdPartyProfileStore.getState().accounts;
            const foundNewSessionFromServer = !accounts.some((x) =>
                isSameSession(session, x.session as ThirdPartySession),
            );
            if (!foundNewSessionFromServer) return;

            const result = await addAccount(
                {
                    session,
                    profile: createDummyProfileFromThirdPartySession(Source.Telegram, session),
                    fireflySession: foundNewSessionFromServer ? await bindOrRestoreFireflySession(session) : undefined,
                },
                {
                    skipBelongsToCheck: !foundNewSessionFromServer,
                    skipResumeFireflyAccounts: !foundNewSessionFromServer,
                    skipResumeFireflySession: !foundNewSessionFromServer,
                    skipSyncAccounts: !foundNewSessionFromServer,
                },
            );

            if (!result) {
                router.replace('/');
                return;
            }

            enqueueSuccessMessage(<Trans>Your Telegram account is now connected</Trans>);

            await delay(1000);

            router.replace('/');
        } catch (error) {
            if (AbortError.is(error)) return;
            if (error instanceof ForbiddenError) {
                enqueueForbiddenMessage();
                return;
            }
            if (error instanceof FireflyAlreadyBoundError) {
                enqueueWarningMessage(
                    <Trans>This Telegram account is already linked to another Firefly account.</Trans>,
                );
                return;
            }
            enqueueMessageFromError(error, <Trans>Oops... Something went wrong. Please try again</Trans>);
            throw error;
        }
    }, [os, router, token]);

    if (os === 'web') {
        return (
            <div className="absolute inset-0 flex flex-col items-center gap-[178px] bg-white pt-20 dark:bg-black md:pt-[124px]">
                <Loading />
            </div>
        );
    }

    return (
        <div className="absolute inset-0 flex flex-col items-center gap-[178px] bg-white pt-20 dark:bg-black md:pt-[124px]">
            <FullLogo width={240} height={240} className="text-black dark:text-white" />
            <div className="w-full px-9 md:max-w-[311px] md:px-0">
                <OpenFireflyAppButton
                    className="w-full rounded-xl bg-black px-5 py-2 text-center text-xl font-bold text-white dark:bg-white dark:text-[#181A20]"
                    schemes={schemes}
                >
                    <Trans>Open in Firefly App</Trans>
                </OpenFireflyAppButton>
            </div>
        </div>
    );
}
