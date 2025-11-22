import { Trans } from '@lingui/react/macro';
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { useAsyncFn } from 'react-use';

import { Card } from '@/app/(whiteboard)/components/Signup/Card.js';
import { LoggedInProfiles, LoggedInProfilesThirdParty } from '@/app/(whiteboard)/components/Signup/LoggedInProfiles.js';
import { LoginButton } from '@/app/(whiteboard)/components/Signup/LoginButton.js';
import { ShadowInAndOut } from '@/app/(whiteboard)/components/Signup/ShadowInAndOut.js';
import { SquareButton } from '@/app/(whiteboard)/components/Signup/SquareButton.js';
import FireflyLogo from '@/assets/firefly-small.svg';
import ShadowLeftArrow from '@/assets/left-arrow-shadow.svg';
import OrbLogo from '@/assets/orb.svg';
import QrScan from '@/assets/qr-scan.svg';
import { LensSignType, SignupStep, Source } from '@/constants/enum.js';
import { enqueueErrorMessage } from '@/helpers/enqueueMessage.js';
import { useCheckFireflyAccount } from '@/hooks/useCheckFireflyAccount.js';
import { useIsLogin } from '@/hooks/useIsLogin.js';
import { useIsLoginFirefly } from '@/hooks/useIsLoginFirefly.js';
import { LoginModalRef } from '@/modals/LoginModal/index.js';
import { SignInWithFireflyAppModalRef } from '@/modals/SignInWithFireflyAppModal.js';
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
    const isLoginFirefly = useIsLoginFirefly();
    const { accounts } = useThirdPartyProfileStore();
    const { isLoading } = useCheckFireflyAccount();

    const canGoNext = isLogin || accounts.length > 0;

    const [{ loading }, handleNext] = useAsyncFn(async () => {
        if (!isLoginFirefly) {
            enqueueErrorMessage(<Trans>Bad login state, please try to login again.</Trans>);
            return;
        }
        changeStep(SignupStep.CreateAccountForm);
    }, [isLoginFirefly, changeStep]);

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
                                onLogin={() => SignInWithFireflyAppModalRef.open()}
                            />
                            <QrScanLogin
                                logo={<OrbLogo className="shrink-0" width={40} height={40} />}
                                title={<Trans>Orb Mobile</Trans>}
                                description={<Trans>Scan QR code to access your account</Trans>}
                                onLogin={() => {
                                    LoginModalRef.open({
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
                            disabled={!canGoNext || isLoading}
                            onClick={handleNext}
                            loading={loading || isLoading}
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
