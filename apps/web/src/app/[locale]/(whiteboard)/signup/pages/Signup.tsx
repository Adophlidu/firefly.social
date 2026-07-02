'use client';

import '@/styles/signup.css';

import { SIGNUP_AUDIO_ID } from '@dimensiondev/constants/static';
import { PageRoute, SignupStep } from '@dimensiondev/enums';
import { delay, safeUnreachable } from '@dimensiondev/utils';
import { AnimatePresence } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useUpdateEffect } from 'react-use';

import { AccountForm } from '@/app/[locale]/(whiteboard)/signup/pages/AccountForm.js';
import { playSignupAudio, preloadSignupAudio } from '@/app/[locale]/(whiteboard)/signup/pages/audio.js';
import { GuidePage } from '@/app/[locale]/(whiteboard)/signup/pages/GuidePage.js';
import { PageBackground } from '@/app/[locale]/(whiteboard)/signup/pages/PageBackground.js';
import { SocialLoginPage } from '@/app/[locale]/(whiteboard)/signup/pages/SocialLoginPage.js';
import { SuccessPage } from '@/app/[locale]/(whiteboard)/signup/pages/SuccessPage.js';
import { queryClient } from '@/configs/queryClient.js';
import { closeLoginModal } from '@/controllers/openLoginModal.js';
import { closeSignInWithFireflyAppModal } from '@/controllers/openSignInWithFireflyAppModal.js';
import { useRouter, useSearchParams } from '@/esm/navigation.js';
import { getSignupRedirectPath } from '@/helpers/getSignupRedirectPath.js';
import { useAsyncStatusAll } from '@/hooks/useAsyncStatus.js';
import { useCheckFireflyAccount } from '@/hooks/useCheckFireflyAccount.js';
import { useGlobalState } from '@/store/useGlobalStore.js';
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

export function Signup() {
    const searchParams = useSearchParams();
    const [step, setStep] = useState<SignupStep>(() => {
        const stepParam = searchParams.get('step') as SignupStep | null;
        return stepParam && Object.values(SignupStep).includes(stepParam) ? stepParam : SignupStep.Welcome;
    });
    const { hasFireflyAccount } = useCheckFireflyAccount(false, true);
    const isSyncing = useAsyncStatusAll();
    const { setPreference } = usePreferencesState();
    const { currentProfileSession } = useFireflyProfileStore();
    const router = useRouter();
    const hasFinished = useRef<boolean>(false);
    const { isSyncingMetrics } = useGlobalState();

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

            if (newStep === SignupStep.CreateAccountForm) {
                // warm up the success-step music while the user fills the form,
                // so preload="none" doesn't delay playback on slow connections
                preloadSignupAudio();
            }

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

    useUpdateEffect(() => {
        if (currentProfileSession?.profileId) {
            router.prefetch(PageRoute.FollowingPosts);
        }
    }, [currentProfileSession?.profileId]);

    // redirect in an effect, not during render: concurrent rendering may run
    // the render body multiple times without committing
    useEffect(() => {
        if (hasFireflyAccount && !hasFinished.current && !isSyncing && !isSyncingMetrics) {
            closeLoginModal();
            closeSignInWithFireflyAppModal();
            router.replace(getSignupRedirectPath());
        }
    }, [hasFireflyAccount, isSyncing, isSyncingMetrics, router]);

    return (
        <AnimatePresence mode="wait">
            <PageBackground step={step}>
                <SignupContent step={step} changeStep={changeStep} />
                {/* preload="none": the 2.4MB track only plays on the Success step; play() triggers the fetch */}
                <audio
                    src="/music/so-happy-with-my-8-bit-game-301275.mp3"
                    preload="none"
                    loop
                    muted
                    id={SIGNUP_AUDIO_ID}
                />
            </PageBackground>
        </AnimatePresence>
    );
}
