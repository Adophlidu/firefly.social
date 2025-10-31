'use client';
import { bom } from '@firefly/utils';
import { Trans } from '@lingui/react/macro';
import { debounce } from 'lodash-es';
import { useEffect, useState } from 'react';

import { ShadowInAndOut } from '@/app/(whiteboard)/components/Signup/ShadowInAndOut.js';
import { SquareButton } from '@/app/(whiteboard)/components/Signup/SquareButton.js';
import AppleIcon from '@/assets/apple-small.svg';
import GoogleStoreIcon from '@/assets/google-store.svg';
import { SignupStep } from '@/constants/enum.js';
import { bedStead } from '@/fonts/bedStead/index.js';
import { useCheckFireflyAccount } from '@/hooks/useCheckFireflyAccount.js';
import { FireflyAccountSVG } from '@/modals/CreateFireflyAccountGuideModal/FireflyAccountSVG.js';
import { DownloadMobileAppModalRef } from '@/modals/DownloadMobileAppModal/index.js';

interface GuidePageProps {
    changeStep: (step: SignupStep) => void;
}

function computeFontSize() {
    const windowWidth = bom.window?.innerWidth || 1920;
    return {
        title: Math.max(20, Math.min(40, (40 / 1920) * windowWidth)),
        tip: Math.max(14, Math.min(18, (18 / 1920) * windowWidth)),
    };
}

export function GuidePage({ changeStep }: GuidePageProps) {
    const { isLoading } = useCheckFireflyAccount(false, true);
    const [fontSizes, setFontSizes] = useState(computeFontSize());

    useEffect(() => {
        const onWindowSizeChange = debounce(() => {
            setFontSizes(computeFontSize());
        }, 100);

        bom.window?.addEventListener('resize', onWindowSizeChange);
        return () => {
            bom.window?.removeEventListener('resize', onWindowSizeChange);
        };
    }, []);

    return (
        <div className="no-scrollbar absolute inset-0 z-1 flex flex-col items-center justify-center gap-[6.875%] md:flex-row">
            <ShadowInAndOut className="hidden [--card-face-color:#FFF9F5] md:block">
                <FireflyAccountSVG width={'26.46vw'} className="ml-auto max-w-[508px]" />
            </ShadowInAndOut>
            <ShadowInAndOut className="w-full max-w-[560px] px-5 text-black md:px-0 md:pt-[8vw]">
                <h1
                    className={`font-bold uppercase leading-[100%] ${bedStead.className}`}
                    style={{
                        fontSize: `${fontSizes.title}px`,
                    }}
                >
                    <Trans>Everything app for Web3 natives</Trans>
                </h1>
                <p
                    className="mt-4 font-bold leading-[100%]"
                    style={{
                        fontSize: `${fontSizes.tip}px`,
                    }}
                >
                    <Trans>
                        Cross-post to multiple platforms, track friends&apos; trades, uncover alpha in social posts
                    </Trans>
                </p>
                <div className="mt-[3.3vw] flex flex-wrap gap-[32px] font-medium">
                    <SquareButton
                        className="text-white"
                        colorMode="dark"
                        loading={isLoading}
                        onClick={() => {
                            changeStep(SignupStep.LoginSocialPlatform);
                        }}
                    >
                        <Trans>Sign In</Trans>
                    </SquareButton>
                    <SquareButton
                        className="text-black"
                        colorMode="light"
                        onClick={() => DownloadMobileAppModalRef.open()}
                    >
                        <div className="flex size-full items-center justify-center gap-3">
                            <Trans>Download App</Trans>
                            <AppleIcon width={24} height={24} />
                            <GoogleStoreIcon className="mt-1" width={18} height={19} />
                        </div>
                    </SquareButton>
                </div>
            </ShadowInAndOut>
        </div>
    );
}
