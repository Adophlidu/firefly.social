'use client';

import { Trans } from '@lingui/react/macro';
import { compact } from 'lodash-es';
import { memo, useCallback } from 'react';
import { FormProvider, useForm, useFormContext } from 'react-hook-form';

import { refreshPageCache } from '@/actions/refreshPageCache.js';
import { ClickableButton } from '@/components/ClickableButton.js';
import { queryClient } from '@/configs/queryClient.js';
import { SORTED_SOCIAL_SOURCES } from '@/constants/computed.js';
import { type SocialSource, Source } from '@/constants/enum.js';
import { FetchError } from '@/constants/error.js';
import { enqueueErrorMessage, enqueueSuccessMessage, enqueueWarningMessage } from '@/helpers/enqueueMessage.js';
import { getCurrentProfileAllFromStorage } from '@/helpers/getCurrentProfileFromStorage.js';
import { getWarningMessageFromError } from '@/helpers/getSnackbarMessageFromError.js';
import { isUserRejectErrorInWallet } from '@/helpers/isUserRejectErrorInWallet.js';
import { queryMyAllConnections } from '@/helpers/queryMyAllConnections.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { resolveSourceName } from '@/helpers/resolveSourceName.js';
import { RouteResolver } from '@/helpers/RouteResolver.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { SignupFormFields } from '@/modals/SignupModal/SignupFormFields.js';
import { captureSocialSignupSuccessEvent } from '@/providers/telemetry/captureSocialAccountSignupEvent.js';
import { type Account } from '@/providers/types/Account.js';
import { type ProfileForSignup } from '@/providers/types/SocialMedia.js';
import { addAccount } from '@/services/account.js';
import { bindFireflySession } from '@/services/bindFireflySession.js';
import { uploadProfileAvatar } from '@/services/uploadProfileAvatar.js';

interface SignupFormValues extends Omit<ProfileForSignup, 'pfp'> {
    pfp?: File;
}

async function refreshProfilePageCache() {
    const currentProfileAll = getCurrentProfileAllFromStorage();
    await Promise.allSettled(
        compact(
            SORTED_SOCIAL_SOURCES.map(async (x) => {
                const profile = currentProfileAll[x];
                if (!profile) return;

                return refreshPageCache(RouteResolver.profile(profile), 'layout');
            }),
        ),
    );
}

interface Props {
    source: SocialSource;
    onClose: (
        data: {
            account: Account;
        } | void,
    ) => void;
    onLoadingChange: (status: boolean) => void;
}

const SignupForm = memo<Props>(function SignupModalContent({ source, onClose, onLoadingChange }) {
    const {
        handleSubmit,
        formState: { isSubmitting, isDirty, isValid },
    } = useFormContext<SignupFormValues>();

    const onSubmit = useCallback(
        async (values: SignupFormValues) => {
            try {
                onLoadingChange(true);

                const pfp = values.pfp ? await uploadProfileAvatar(source, values.pfp) : values.pfp;
                const account = await resolveSocialMediaProvider(source).createAccount({
                    ...values,
                    pfp,
                });

                // For farcaster, has bound session in backend
                if (source !== Source.Farcaster) {
                    await bindFireflySession(account.session);
                }
                await addAccount(account, {
                    skipBelongsToCheck: true,
                    skipResumeFireflyAccounts: true,
                    skipResumeFireflySession: true,
                    setAsCurrent: true,
                    forceUploadMetrics: true,
                });

                captureSocialSignupSuccessEvent(account);
                onClose({ account });
                runInSafeAsync(() => queryClient.refetchQueries({ queryKey: queryMyAllConnections.queryKey }));
                enqueueSuccessMessage(<Trans>{resolveSourceName(source)} profile created.</Trans>);

                refreshProfilePageCache();
            } catch (error) {
                if (isUserRejectErrorInWallet(error)) {
                    enqueueWarningMessage(getWarningMessageFromError(error));
                    return;
                }
                if (error instanceof FetchError) {
                    const message = error.errorMessage;
                    if (message) {
                        enqueueErrorMessage(message, { error });
                        return;
                    }
                }

                enqueueErrorMessage(
                    <Trans>
                        Failed to create {resolveSourceName(source)} profile.
                        {error instanceof Error ? error.message : ''}
                    </Trans>,
                    { error },
                );
                throw error;
            } finally {
                onLoadingChange(false);
            }
        },
        [source, onClose, onLoadingChange],
    );

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex size-full flex-col">
            <div className="no-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto px-6 pb-6">
                <SignupFormFields source={source} disabled={isSubmitting} />
            </div>
            <div className="px-6 pb-4 pt-2">
                <ClickableButton
                    type="submit"
                    enableDefault
                    enablePropagate
                    loading={isSubmitting}
                    disabled={!isDirty || !isValid || isSubmitting}
                    className="bg-main text-medium text-primaryBottom h-10 w-full rounded-lg font-bold outline-none"
                    aria-label="Sign Up"
                >
                    <Trans>Sign Up</Trans>
                </ClickableButton>
            </div>
        </form>
    );
});

export function SignupModalContent(props: Props) {
    const form = useForm<SignupFormValues>({
        mode: 'onChange',
    });

    return (
        <FormProvider {...form}>
            <SignupForm {...props} />
        </FormProvider>
    );
}
