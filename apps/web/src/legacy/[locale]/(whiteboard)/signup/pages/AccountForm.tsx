'use client';

import ShadowLeftArrow from '@dimensiondev/assets/left-arrow-shadow.svg';
import { SignupStep, Source } from '@dimensiondev/enums';
import { classNames, runInSafeAsync } from '@dimensiondev/utils';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { motion } from 'framer-motion';
import { compact, first } from 'lodash-es';
import { useCallback, useMemo, useState } from 'react';
import { useAsyncFn } from 'react-use';

import { type AvatarConfig, AvatarSelector } from '@/legacy/[locale]/(whiteboard)/components/Signup/AvatarSelector.js';
import { Card } from '@/legacy/[locale]/(whiteboard)/components/Signup/Card.js';
import { LoadingBar } from '@/legacy/[locale]/(whiteboard)/components/Signup/LoadingBar.js';
import { LoggedInSources } from '@/legacy/[locale]/(whiteboard)/components/Signup/LoggedInSources.js';
import { ShadowInAndOut } from '@/legacy/[locale]/(whiteboard)/components/Signup/ShadowInAndOut.js';
import { SquareButton } from '@/legacy/[locale]/(whiteboard)/components/Signup/SquareButton.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { FIREFLY_DISPLAY_NAME_REGEXP } from '@/constants/regexp.js';
import { downloadUrlWithProxy } from '@/helpers/downloadMediaObjects.js';
import { enqueueErrorMessage, enqueueMessageFromError } from '@/helpers/enqueueMessage.js';
import { getStampAvatarByProfileId } from '@/helpers/getStampAvatarByProfileId.js';
import { trimify } from '@/helpers/trimify.js';
import { useCheckFireflyAccount } from '@/hooks/useCheckFireflyAccount.js';
import { useCurrentProfilesAll } from '@/hooks/useCurrentProfile.js';
import { updateProfile } from '@/providers/firefly/endpoint/updateProfile.js';
import { autoCreateLensAccount } from '@/services/account.js';
import { uploadToS3 } from '@/services/uploadToS3.js';

interface AccountFormProps {
    changeStep: (step: SignupStep, params?: Record<string, string>) => void;
}

function checkNickname(nickname: string) {
    if (!nickname) return null;

    if (nickname.length < 1) {
        return <Trans>Display Name should not be blank</Trans>;
    }

    if (nickname.length > 20) {
        return <Trans>Display Name should not exceed 20 characters</Trans>;
    }

    if (!FIREFLY_DISPLAY_NAME_REGEXP.test(nickname)) {
        return <Trans>Nickname must not contain restricted symbols</Trans>;
    }

    return null;
}

export function AccountForm({ changeStep }: AccountFormProps) {
    const { isLoading } = useCheckFireflyAccount();
    const profilesAll = useCurrentProfilesAll();
    const availableProfiles = useMemo(
        () =>
            compact(
                ([Source.Twitter, Source.Farcaster, Source.Lens, Source.Bsky] as const).map((source) => {
                    const profile = profilesAll[source];
                    return profile?.displayName && profile.pfp ? profile : null;
                }),
            ),
        [profilesAll],
    );

    const firstAvailableProfile = first(availableProfiles);
    const [nickname, setNickname] = useState(firstAvailableProfile?.displayName || '');
    const [avatar, setAvatar] = useState<AvatarConfig>({
        url: firstAvailableProfile?.pfp || getStampAvatarByProfileId(Source.Firefly, crypto.randomUUID()),
        file: null,
        type: firstAvailableProfile?.pfp ? 'pfp' : 'random',
    });

    const onAvatarChange = useCallback((newConfig: AvatarConfig, name?: string) => {
        setAvatar(() => ({
            ...newConfig,
            file: newConfig.type !== 'custom' ? null : newConfig.file,
        }));

        if (name) {
            setNickname(name);
        }
    }, []);

    const [{ loading }, setNicknameAndAvatar] = useAsyncFn(async () => {
        try {
            let avatarFile = avatar.type === 'custom' ? avatar.file : null;
            if (avatar.type !== 'custom') {
                avatarFile = await downloadUrlWithProxy(avatar.url, `avatar-${crypto.randomUUID()}.jpg`);
            }
            if (!avatarFile) {
                enqueueErrorMessage(<Trans>Failed to read avatar file, please try again.</Trans>);
                return;
            }

            const s3Url = await uploadToS3(avatarFile);
            await updateProfile({
                displayName: nickname,
                avatar: s3Url,
            });
            // auto-create & bind a Lens account now that the Firefly profile
            // (nickname + avatar) exists; tolerate failures and never retry.
            await runInSafeAsync(() =>
                autoCreateLensAccount({
                    displayName: nickname,
                    avatarUrl: s3Url,
                }),
            );
            changeStep(SignupStep.Success, {
                nickname: encodeURIComponent(nickname),
                avatar: encodeURIComponent(s3Url),
            });
        } catch (error) {
            enqueueMessageFromError(error, <Trans>Failed to create Firefly profile.</Trans>);
            throw error;
        }
    }, [avatar, nickname, changeStep]);

    const nicknameError = useMemo(() => checkNickname(nickname), [nickname]);
    const isValidNickname = !!nickname && !nicknameError;
    const canGoNext =
        !!trimify(nickname) && (avatar.type === 'custom' ? !!avatar.file : !!avatar.url) && !nicknameError;

    return (
        <ShadowInAndOut className="absolute inset-0 z-1 flex items-center justify-center">
            <Card>
                {loading || isLoading ? (
                    <div className="absolute inset-0 z-10 flex items-center justify-center">
                        {loading ? <LoadingBar /> : <LoadingIcon />}
                    </div>
                ) : (
                    <div className="no-scrollbar flex h-full flex-col justify-between overflow-y-auto p-3 pt-0 md:p-12 md:pt-0">
                        <div className="w-full">
                            <div className="sticky top-0 z-1 flex items-center gap-4 bg-white pt-3 md:pt-12">
                                <motion.button
                                    whileTap={{ scale: 0.8 }}
                                    onClick={() => changeStep(SignupStep.LoginSocialPlatform)}
                                >
                                    <ShadowLeftArrow width={24} height={24} />
                                </motion.button>
                                <LoggedInSources />
                            </div>
                            <div className="mt-6 text-center">
                                <h1 className="text-2xl font-semibold text-[#171717]">
                                    <Trans>Create your Firefly profile</Trans>
                                </h1>
                                <p className="mt-2 text-sm font-medium text-[#6b6b6b]">
                                    <Trans>Your gateway to a personalized social experience.</Trans>
                                </p>
                            </div>
                            <AvatarSelector
                                avatar={avatar.url}
                                avatarType={avatar.type}
                                profiles={availableProfiles}
                                onChange={onAvatarChange}
                            />
                            <div className="mt-6">
                                <label htmlFor="firefly-nickname" className="text-sm font-medium text-[#171717]">
                                    <Trans>Nickname</Trans>
                                </label>
                                <br />
                                <input
                                    id="firefly-nickname"
                                    value={nickname}
                                    className={classNames(
                                        'mt-2 h-12 w-full rounded-lg border border-transparent text-center text-[#171717] outline-0 focus:outline-0 focus:ring-0',
                                        !nickname ? 'focus:border-danger' : 'focus:border-highlight',
                                    )}
                                    style={{
                                        backgroundColor: 'rgba(124, 127, 163, 0.08)',
                                    }}
                                    placeholder={t`Enter your nickname on Firefly`}
                                    onChange={(e) => setNickname(trimify(e.target.value))}
                                    minLength={1}
                                    autoComplete="off"
                                    spellCheck="false"
                                />
                                <p
                                    className={classNames(
                                        'mt-2 h-4 text-center text-xs font-medium',
                                        isValidNickname ? 'text-success' : 'text-danger',
                                    )}
                                >
                                    {isValidNickname ? <Trans>Available</Trans> : nicknameError}
                                </p>
                            </div>
                        </div>
                        <div className="mt-2 w-full text-center md:mt-0">
                            <SquareButton disabled={!canGoNext} onClick={setNicknameAndAvatar}>
                                <span className="text-base font-medium">
                                    <Trans>Done</Trans>
                                </span>
                            </SquareButton>
                        </div>
                    </div>
                )}
            </Card>
        </ShadowInAndOut>
    );
}
