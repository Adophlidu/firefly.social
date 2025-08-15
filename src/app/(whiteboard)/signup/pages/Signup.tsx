'use client';

import '@/assets/css/signup.css';

import { AnimatePresence } from 'framer-motion';
import { useCallback, useRef, useState } from 'react';

import { AccountForm } from '@/app/(whiteboard)/signup/pages/AccountForm.js';
import { playSignupAudio } from '@/app/(whiteboard)/signup/pages/audio.js';
import { GuidePage } from '@/app/(whiteboard)/signup/pages/GuidePage.js';
import { PageBackground } from '@/app/(whiteboard)/signup/pages/PageBackground.js';
import { SocialLoginPage } from '@/app/(whiteboard)/signup/pages/SocialLoginPage.js';
import { SuccessPage } from '@/app/(whiteboard)/signup/pages/SuccessPage.js';
import { queryClient } from '@/configs/queryClient.js';
import { PageRoute, SignupStep } from '@/constants/enum.js';
import { SIGNUP_AUDIO_ID } from '@/constants/index.js';
import { redirect, RedirectType } from '@/esm/navigation.js';
import { delay } from '@/helpers/delay.js';
import { safeUnreachable } from '@/helpers/unreachable.js';
import { useCheckFireflyAccount } from '@/hooks/useCheckFireflyAccount.js';
import { LoginModalRef } from '@/modals/LoginModal/index.js';
import { usePreferencesState } from '@/store/usePreferenceStore.js';
import { useFireflyProfileStore } from '@/store/useProfileStore/useFireflyProfileStore.js';

interface SignupContentProps {
    step: SignupStep;
    changeStep: (step: SignupStep, params?: Record<string, string>) => void;
}

function SignupContent({ step, changeStep }: SignupContentProps) {
    const renderStep = useCallback(() => {
        switch (step) {
            case SignupStep.Welcome:
                return <GuidePage changeStep={changeStep} />;
            case SignupStep.LoginSocialPlatform:
                return <SocialLoginPage changeStep={changeStep} />;
            case SignupStep.CreateAccountForm:
                return <AccountForm changeStep={changeStep} />;
            case SignupStep.Success:
                return <SuccessPage />;
            default:
                safeUnreachable(step);
                return null;
        }
    }, [step, changeStep]);

    return <AnimatePresence mode="wait">{renderStep()}</AnimatePresence>;
}

interface SignupProps {
    initialStep?: SignupStep;
}

export function Signup({ initialStep }: SignupProps) {
    const [step, setStep] = useState<SignupStep>(initialStep || SignupStep.Welcome);
    const { hasFireflyAccount, displayName, avatar } = useCheckFireflyAccount(false, true);
    const { setPreference } = usePreferencesState();
    const { currentProfileSession } = useFireflyProfileStore();
    const hasFinished = useRef<boolean>(false);

    const changeStep = useCallback(
        (newStep: SignupStep, params?: Record<string, string>) => {
            setStep(newStep);
            // update the URL to reflect the current step
            const url = new URL(location.href);
            if (params) {
                Object.entries(params).forEach(([key, value]) => {
                    url.searchParams.set(key, value);
                });
            }
            url.searchParams.set('step', newStep.toString());
            history.replaceState({}, '', url.toString());

            if (newStep === SignupStep.Success) {
                const accountId = currentProfileSession?.profileId;
                if (accountId) {
                    hasFinished.current = true;
                    setPreference('FIREFLY_ACCOUNT_CHECKED_MAP', (prev) => ({
                        ...prev,
                        [accountId]: true,
                    }));
                    queryClient.setQueryData(['check-firefly-account', accountId], {
                        hasFireflyAccount: true,
                        displayName: params?.nickname,
                        avatar: params?.avatar,
                    });
                    delay(500).then(() => {
                        playSignupAudio();
                    });
                }
            }
        },
        [currentProfileSession?.profileId, setPreference, setStep],
    );

    if (hasFireflyAccount && !hasFinished.current) {
        if (displayName) {
            LoginModalRef.close();
            changeStep(SignupStep.Success, {
                nickname: encodeURIComponent(displayName),
                avatar: avatar ? encodeURIComponent(avatar) : '',
                isBack: '1',
            });
            return null;
        }
        redirect(PageRoute.FollowingPosts, RedirectType.replace);
    }

    return (
        <AnimatePresence mode="wait">
            <PageBackground step={step}>
                <SignupContent step={step} changeStep={changeStep} />
                <audio src="/music/so-happy-with-my-8-bit-game-301275.mp3" loop muted id={SIGNUP_AUDIO_ID} />
            </PageBackground>
        </AnimatePresence>
    );
}
