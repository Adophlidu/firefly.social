'use client';

import { Trans } from '@lingui/react/macro';
import { compact } from 'lodash-es';
import { memo, useCallback } from 'react';
import { FormProvider, useForm, useFormContext } from 'react-hook-form';

import { refreshPageCache } from '@/actions/refreshPageCache.js';
import { ClickableButton } from '@/components/ClickableButton.js';
import { queryClient } from '@/configs/queryClient.js';
import { type SocialSource, Source } from '@/constants/enum.js';
import { SORTED_SOCIAL_SOURCES } from '@/constants/index.js';
import { enqueueErrorMessage, enqueueSuccessMessage, enqueueWarningMessage } from '@/helpers/enqueueMessage.js';
import { getCurrentProfileAllFromStorage } from '@/helpers/getCurrentProfileFromStorage.js';
import { getWarningMessageFromError } from '@/helpers/getSnackbarMessageFromError.js';
import { isUserRejectErrorInWallet } from '@/helpers/isUserRejectErrorInWallet.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { resolveSourceName } from '@/helpers/resolveSourceName.js';
import { RouteResolver } from '@/helpers/RouteResolver.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { queryMyAllConnections } from '@/hooks/useAllConnections.js';
import { SignupFormFields } from '@/modals/SignupModal/SignupFormFields.js';
import { checkAndSyncMetrics } from '@/providers/firefly/metrics/checkAndSyncMetrics.js';
import { ensureLensResult } from '@/providers/lens/ensureLensResult.js';
import { updateCredentialsStorage } from '@/providers/lens/getLensCredentialsFromStorage.js';
import { lensClientHolder } from '@/providers/lens/LensClientHolder.js';
import { lensSessionClientHolder } from '@/providers/lens/LensSessionClientHolder.js';
import type { LensSession } from '@/providers/lens/Session.js';
import { setPrivyAsLensManager } from '@/providers/lens/setPrivyAsLensManager.js';
import { captureSocialSignupSuccessEvent } from '@/providers/telemetry/captureSocialAccountSignupEvent.js';
import type { Account } from '@/providers/types/Account.js';
import type { LensCredentials } from '@/providers/types/Lens.js';
import type { ProfileForSignup } from '@/providers/types/SocialMedia.js';
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
    const form = useFormContext<SignupFormValues>();

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
                    skipSyncAccounts: true,
                });
                if (source === Source.Lens) {
                    const session = account.session as LensSession;
                    updateCredentialsStorage({
                        accessToken: session.token,
                        refreshToken: session.refreshToken,
                        idToken: session.identityToken,
                    } as LensCredentials);
                    const sessionClient = await ensureLensResult(lensClientHolder.client.resumeSession());
                    lensSessionClientHolder.setSessionClient(sessionClient);

                    await runInSafeAsync(() => setPrivyAsLensManager(account));
                }

                captureSocialSignupSuccessEvent(account);
                onClose({ account });
                runInSafeAsync(() => queryClient.refetchQueries({ queryKey: queryMyAllConnections.queryKey }));
                enqueueSuccessMessage(<Trans>{resolveSourceName(source)} profile created.</Trans>);

                // sync metrics in the final step
                runInSafeAsync(() => checkAndSyncMetrics(account, { forceUpload: true }));

                refreshProfilePageCache();
            } catch (error) {
                if (isUserRejectErrorInWallet(error)) {
                    enqueueWarningMessage(getWarningMessageFromError(error));
                } else {
                    enqueueErrorMessage(
                        <Trans>
                            Failed to create {resolveSourceName(source)} profile.
                            {error instanceof Error ? error.message : ''}
                        </Trans>,
                        { error },
                    );
                }
                throw error;
            } finally {
                onLoadingChange(false);
            }
        },
        [source, onClose, onLoadingChange],
    );

    const {
        handleSubmit,
        formState: { isSubmitting, isDirty, isValid },
    } = form;

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
                    className="h-10 w-full rounded-lg bg-main text-medium font-bold text-primaryBottom outline-none"
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
