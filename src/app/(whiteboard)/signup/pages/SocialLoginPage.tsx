import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { motion } from 'framer-motion';
import { useAsyncFn } from 'react-use';

import { Card } from '@/app/(whiteboard)/components/Signup/Card.js';
import { LoggedInProfiles, LoggedInProfilesThirdParty } from '@/app/(whiteboard)/components/Signup/LoggedInProfiles.js';
import { LoginButton } from '@/app/(whiteboard)/components/Signup/LoginButton.js';
import { ShadowInAndOut } from '@/app/(whiteboard)/components/Signup/ShadowInAndOut.js';
import { SquareButton } from '@/app/(whiteboard)/components/Signup/SquareButton.js';
import FireflyLogo from '@/assets/firefly-small.svg';
import ShadowLeftArrow from '@/assets/left-arrow-shadow.svg';
import QrScan from '@/assets/qr-scan.svg';
import { SignupStep, Source } from '@/constants/enum.js';
import { enqueueErrorMessage } from '@/helpers/enqueueMessage.js';
import { useAsyncStatusAll } from '@/hooks/useAsyncStatus.js';
import { useIsLogin, useIsLoginFirefly } from '@/hooks/useIsLogin.js';
import { SignInWithFireflyAppModalRef } from '@/modals/controls.js';
import { useThirdPartyStateStore } from '@/store/useProfileStore.js';

interface SocialLoginPageProps {
    changeStep: (step: SignupStep) => void;
}

export function SocialLoginPage({ changeStep }: SocialLoginPageProps) {
    const isLogin = useIsLogin();
    const isLoginFirefly = useIsLoginFirefly();
    const { accounts } = useThirdPartyStateStore();
    const isLoading = useAsyncStatusAll();

    const canGoNext = isLogin || accounts.length > 0;

    const [{ loading }, handleNext] = useAsyncFn(async () => {
        if (!isLoginFirefly) {
            enqueueErrorMessage(t`Bad login state, please try to login again.`);
            return;
        }
        changeStep(SignupStep.CreateAccountForm);
    }, [isLoginFirefly, changeStep]);

    return (
        <ShadowInAndOut className="absolute inset-0 z-1 flex items-center justify-center overflow-hidden">
            <Card>
                <div className="no-scrollbar flex h-full flex-col justify-between overflow-y-auto p-3 pb-20 pt-0 md:p-12 md:pt-0">
                    <div className="w-full">
                        <div className="sticky top-0 z-1 bg-white pt-3 md:pt-12">
                            <motion.button whileTap={{ scale: 0.8 }} onClick={() => changeStep(SignupStep.Welcome)}>
                                <ShadowLeftArrow width={24} height={24} />
                            </motion.button>
                        </div>
                        <div className="mt-6 text-center">
                            <h1 className="text-2xl font-semibold text-[#171717]">
                                <Trans>Pick a way to sign in</Trans>
                            </h1>
                            <p className="mt-2 text-sm font-medium text-[#6b6b6b]">
                                <Trans>Scan with your phone, or connect instantly via social.</Trans>
                            </p>
                        </div>
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            className="mt-6 flex w-full cursor-pointer items-center gap-6 rounded-xl p-4"
                            style={{
                                backgroundColor: 'rgba(124, 127, 163, 0.06)',
                            }}
                            onClick={() => {
                                SignInWithFireflyAppModalRef.open();
                            }}
                        >
                            <div className="flex min-w-0 flex-1 items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white">
                                    <FireflyLogo width={23} height={30} />
                                </div>
                                <div className="text-left">
                                    <p className="text-base font-semibold text-main">
                                        <Trans>Firefly Mobile</Trans>
                                    </p>
                                    <p className="text-sm text-second">
                                        <Trans>Scan QR code to access your account</Trans>
                                    </p>
                                </div>
                            </div>
                            <QrScan width={28} height={28} className="shrink-0" />
                        </motion.button>
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
                </div>
                <div className="absolute inset-x-0 bottom-0 px-3">
                    <div className="w-full bg-white pb-3 pt-2 text-center md:pb-12">
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
