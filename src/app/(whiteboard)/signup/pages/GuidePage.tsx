import { Trans } from '@lingui/react/macro';

import { ShadowInAndOut } from '@/app/(whiteboard)/components/Signup/ShadowInAndOut.js';
import { SquareButton } from '@/app/(whiteboard)/components/Signup/SquareButton.js';
import AppleIcon from '@/assets/apple-small.svg';
import GoogleStoreIcon from '@/assets/google-store.svg';
import { SignupStep } from '@/constants/enum.js';
import { bedStead } from '@/fonts/index.js';
import { openWindow } from '@/helpers/openWindow.js';
import { FireflyAccountSVG } from '@/modals/CreateFireflyAccountGuideModal/FireflyAccountSVG.js';

interface GuidePageProps {
    changeStep: (step: SignupStep) => void;
}

export function GuidePage({ changeStep }: GuidePageProps) {
    return (
        <div className="no-scrollbar absolute inset-0 z-1 flex flex-col items-center justify-center gap-[6.875%] md:flex-row">
            <ShadowInAndOut className="hidden [--card-face-color:#FFF9F5] md:block">
                <FireflyAccountSVG />
            </ShadowInAndOut>
            <ShadowInAndOut className="w-full px-5 text-black md:w-[29.2%] md:px-0">
                <h1 className={`text-[40px] font-bold uppercase leading-[40px] ${bedStead.className}`}>
                    <Trans>Everything app for Web3 natives</Trans>
                </h1>
                <p className="mt-4 text-lg font-bold !leading-6">
                    <Trans>
                        Cross-post to multiple platforms, track friends&apos; trades, uncover alpha in social posts
                    </Trans>
                </p>
                <div className="mt-16 flex flex-wrap gap-[32px] font-medium">
                    <SquareButton
                        className="text-white"
                        colorMode="dark"
                        onClick={() => {
                            changeStep(SignupStep.LoginSocialPlatform);
                        }}
                    >
                        <Trans>Sign In</Trans>
                    </SquareButton>
                    <SquareButton
                        className="text-black"
                        colorMode="light"
                        onClick={() => {
                            openWindow('https://firefly.social/about');
                        }}
                    >
                        <Trans>Download App</Trans>
                        <AppleIcon width={24} height={24} />
                        <GoogleStoreIcon className="mt-1" width={18} height={19} />
                    </SquareButton>
                </div>
            </ShadowInAndOut>
        </div>
    );
}
