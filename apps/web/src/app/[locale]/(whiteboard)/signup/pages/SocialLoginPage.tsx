'use client';

import FireflyLogo from '@dimensiondev/assets/firefly-small.svg';
import ShadowLeftArrow from '@dimensiondev/assets/left-arrow-shadow.svg';
import OrbLogo from '@dimensiondev/assets/orb.svg';
import QrScan from '@dimensiondev/assets/qr-scan.svg';
import { AsyncStatus, LensSignType, PageRoute, SignupStep, Source } from '@dimensiondev/enums';
import { Trans } from '@lingui/react/macro';
import { motion } from 'framer-motion';
import { first } from 'lodash-es';
import { type ReactNode, useEffect } from 'react';
import { useAsyncFn } from 'react-use';

import { Card } from '@/app/[locale]/(whiteboard)/components/Signup/Card.js';
import {
    LoggedInProfiles,
    LoggedInProfilesThirdParty,
} from '@/app/[locale]/(whiteboard)/components/Signup/LoggedInProfiles.js';
import { LoginButton } from '@/app/[locale]/(whiteboard)/components/Signup/LoginButton.js';
import { ShadowInAndOut } from '@/app/[locale]/(whiteboard)/components/Signup/ShadowInAndOut.js';
import { SquareButton } from '@/app/[locale]/(whiteboard)/components/Signup/SquareButton.js';
import { useRouter } from '@/esm/navigation.js';
import { enqueueErrorMessage } from '@/helpers/enqueueMessage.js';
import { formatFireflyAccountProfileFromFireflyConnections } from '@/helpers/formatFireflyAccountProfileFromFireflyConnections.js';
import { getAllAccounts } from '@/helpers/getAllProfiles.js';
import { openLoginModal } from '@/helpers/openLoginModal.js';
import { openSignInWithFireflyAppModal } from '@/helpers/openSignInWithFireflyAppModal.js';
import { useCheckFireflyAccount } from '@/hooks/useCheckFireflyAccount.js';
import { useIsLogin } from '@/hooks/useIsLogin.js';
import { autoLoginLensAccountsInSignup } from '@/providers/lens/autoLoginLensAccountsInSignup.js';
import { resumeFireflySession } from '@/services/account.js';
import { useGlobalState } from '@/store/useGlobalStore.js';
import { useFireflyProfileStore } from '@/store/useProfileStore/useFireflyProfileStore.js';
import { useThirdPartyProfileStore } from '@/store/useProfileStore/useThirdPartyProfileStore.js';

interface SocialLoginPageProps {
    changeStep: (step: SignupStep) => void;
}

interface QrScanLoginProps {
    logo: ReactNode;
    title: ReactNode;
    description: ReactNode;
    onLogin: () => void;
}

function QrScanLogin({ logo, title, description, onLogin }: QrScanLoginProps) {
    return (
        <motion.button
            whileTap={{ scale: 0.95 }}
            className="flex w-full cursor-pointer items-center gap-6 rounded-xl p-4"
            style={{
                backgroundColor: 'rgba(124, 127, 163, 0.06)',
            }}
            onClick={onLogin}
        >
            <div className="flex min-w-0 flex-1 items-center gap-3">
                {logo}
                <div className="text-left">
                    <p className="text-base font-semibold text-main">{title}</p>
                    <p className="text-sm text-second">{description}</p>
                </div>
            </div>
            <QrScan width={28} height={28} className="shrink-0" />
        </motion.button>
    );
}

export function SocialLoginPage({ changeStep }: SocialLoginPageProps) {
    const isLogin = useIsLogin();
    const { currentProfileSession, status: asyncStatus } = useFireflyProfileStore();
    const isLoginFirefly = !!currentProfileSession;
    const isAsyncPending = asyncStatus === AsyncStatus.Pending;
    const { accounts } = useThirdPartyProfileStore();
    const { isLoading } = useCheckFireflyAccount();
    const { isSyncingMetrics } = useGlobalState();
    const router = useRouter();

    const canGoNext = isLogin || accounts.length > 0;

    const [{ loading }, handleNext] = useAsyncFn(async () => {
        if (isLoginFirefly) {
            changeStep(SignupStep.CreateAccountForm);
            return;
        }

        const socialAccounts = getAllAccounts();
        const firstAccount = first(socialAccounts);
        if (!firstAccount) {
            enqueueErrorMessage(<Trans>Bad login state, please try to login again.</Trans>);
            return;
        }

        try {
            const connections = await resumeFireflySession(firstAccount);
            const fireflyAccount = formatFireflyAccountProfileFromFireflyConnections(connections.account, false);
            const hasFireflyAccount = !!fireflyAccount?.displayName || !!fireflyAccount?.avatar;
            if (hasFireflyAccount) {
                router.replace(PageRoute.FollowingPosts);
            } else {
                changeStep(SignupStep.CreateAccountForm);
            }
        } catch {
            enqueueErrorMessage(<Trans>Failed to resume Firefly session. Please try again.</Trans>);
        }
    }, [isLoginFirefly, router, changeStep]);

    useEffect(() => {
        return useFireflyProfileStore.subscribe((state, prevState) => {
            const currentId = state.currentProfileSession?.profileId;
            const prevId = prevState.currentProfileSession?.profileId;
            if (!currentId || currentId === prevId) return;

            autoLoginLensAccountsInSignup({ fireflyAccountId: currentId.toString() });
        });
    }, []);

    return (
        <ShadowInAndOut className="absolute inset-0 z-1 flex items-center justify-center overflow-hidden">
            <Card>
                <div className="flex h-full flex-col p-3 md:p-12">
                    <div className="shrink-0 bg-white">
                        <motion.button whileTap={{ scale: 0.8 }} onClick={() => changeStep(SignupStep.Welcome)}>
                            <ShadowLeftArrow width={24} height={24} />
                        </motion.button>
                    </div>
                    <div className="no-scrollbar min-h-0 w-full flex-1 overflow-y-auto">
                        <div className="mt-6 text-center">
                            <h1 className="text-2xl font-semibold text-[#171717]">
                                <Trans>Pick a way to sign in</Trans>
                            </h1>
                            <p className="mt-2 text-sm font-medium text-[#6b6b6b]">
                                <Trans>Scan with your phone, or connect instantly via social.</Trans>
                            </p>
                        </div>

                        <div className="mt-6 space-y-2">
                            <QrScanLogin
                                logo={
                                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white">
                                        <FireflyLogo width={23} height={30} />
                                    </div>
                                }
                                title={<Trans>Firefly Mobile</Trans>}
                                description={<Trans>Scan QR code to access your account</Trans>}
                                onLogin={() => openSignInWithFireflyAppModal()}
                            />
                            <QrScanLogin
                                logo={<OrbLogo className="shrink-0" width={40} height={40} />}
                                title={<Trans>Orb Mobile</Trans>}
                                description={<Trans>Scan QR code to access your account</Trans>}
                                onLogin={() => {
                                    openLoginModal({
                                        source: Source.Lens,
                                        options: {
                                            noBackButton: true,
                                            expectedLensSignType: LensSignType.OrbScan,
                                            skipWaitForMetricsSyncing: false,
                                        },
                                    });
                                }}
                            />
                        </div>

                        <div className="mt-6">
                            <p className="text-center text-sm font-medium text-[#6b6b6b]">
                                <Trans>Social accounts</Trans>
                            </p>
                            <div className="mt-6 flex flex-wrap justify-center gap-2 md:gap-6">
                                <LoggedInProfiles source={Source.Twitter} />
                                <LoginButton source={Source.Twitter} />

                                <LoggedInProfiles source={Source.Lens} />
                                <LoginButton source={Source.Lens} />

                                <LoggedInProfiles source={Source.Farcaster} />
                                <LoginButton source={Source.Farcaster} />

                                <LoggedInProfiles source={Source.Bsky} />
                                <LoginButton source={Source.Bsky} />

                                <LoggedInProfilesThirdParty />
                                <LoginButton source="other" />
                            </div>
                        </div>
                    </div>
                    <div className="h-14 w-full shrink-0 bg-white pt-2 text-center">
                        <SquareButton
                            disabled={!canGoNext}
                            onClick={handleNext}
                            loading={loading || isLoading || isSyncingMetrics || isAsyncPending}
                        >
                            <span className="text-base font-medium">
                                <Trans>Next</Trans>
                            </span>
                        </SquareButton>
                    </div>
                </div>
            </Card>
        </ShadowInAndOut>
    );
}
