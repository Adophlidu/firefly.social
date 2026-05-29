'use client';

import RightArrowIcon from '@dimensiondev/assets/right-arrow.svg';
import { PasswordWorkflow } from '@dimensiondev/enums';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { memo } from 'react';
import { useAsyncFn } from 'react-use';

import { ContentCard } from '@/app/[locale]/(settings)/settings/privacy-and-security/pages/ContentCard.js';
import { ClickableButton } from '@/components/ClickableButton.js';
import { Switch } from '@/components/Switch/index.js';
import { queryClient } from '@/configs/queryClient.js';
import { enqueueErrorMessage, enqueueSuccessMessage } from '@/helpers/enqueueMessage.js';
import { openLoginModalWithGuard } from '@/helpers/openLoginModal.js';
import { useIsLoginFirefly } from '@/hooks/useIsLoginFirefly.js';
import { ConfirmModalRef } from '@/modals/ConfirmModal/refs.js';
import { PasswordModalRef } from '@/modals/PasswordModal/refs.js';
import { getMetricsStatus } from '@/providers/firefly/metrics/getMetricsStatus.js';
import { resetPasscode } from '@/providers/firefly/metrics/resetPasscode.js';
import { captureRemovePasscodeEvent } from '@/providers/telemetry/capturePasscodeEvent.js';

function ToggleSyncSessionSwitch({
    isLogin,
    checked,
    isLoading,
}: {
    isLogin: boolean;
    checked: boolean;
    isLoading: boolean;
}) {
    const [{ loading }, onSwitch] = useAsyncFn(
        async (value: boolean) => {
            try {
                if (!isLogin) {
                    openLoginModalWithGuard();
                    return;
                }
                if (value) {
                    const result = await PasswordModalRef.openAndWaitForClose({ workflow: PasswordWorkflow.Set });
                    if (result === true) {
                        queryClient.setQueryData(['session-sync-status', isLogin], true);
                    }
                    return;
                }

                const confirmed = await ConfirmModalRef.openAndWaitForClose({
                    title: <Trans>Turn off</Trans>,
                    variant: 'normal',
                    enableCancelButton: true,
                    enableCloseButton: false,
                    modalStyle: { width: 400, maxWidth: '90vw' },
                    content: (
                        <div className="text-main">
                            <Trans>
                                Turning off Multi-device login will clear all previously encrypted login sessions. A new
                                password is required to re-enable.
                            </Trans>
                        </div>
                    ),
                });
                if (!confirmed) return;

                await resetPasscode();
                queryClient.setQueryData(['session-sync-status', isLogin], false);
                enqueueSuccessMessage(
                    <Trans>Multi-device login is now turned off and all previously sessions are cleared.</Trans>,
                );
                captureRemovePasscodeEvent();
            } catch (error) {
                enqueueErrorMessage(
                    value
                        ? t`Failed to enable Multi-device login. Please try again later.`
                        : t`Failed to disable Multi-device login. Please try again later.`,
                    { error },
                );
                throw error;
            }
        },
        [isLogin],
    );

    return (
        <Switch
            disabled={isLoading || loading}
            loading={isLoading || loading}
            checked={checked}
            onChange={onSwitch}
            size="medium"
        />
    );
}

export const PasswordSettings = memo(function PasswordSettings() {
    const isLogin = useIsLoginFirefly();
    const { data = false, isLoading } = useQuery({
        queryKey: ['session-sync-status', isLogin],
        enabled: isLogin,
        queryFn: async () => {
            const response = await getMetricsStatus();
            return response.hasSetPasscode;
        },
    });

    return (
        <ContentCard
            label={<Trans>Multi-device login</Trans>}
            description={
                <Trans>
                    Encrypt your login session with a 6-digit password to enable one-click login across devices.
                </Trans>
            }
            headerSlot={<ToggleSyncSessionSwitch checked={data} isLoading={isLoading} isLogin={isLogin} />}
        >
            {data ? (
                <div className="w-full">
                    <ClickableButton
                        className="-mx-3 mt-2 flex w-full items-center justify-between rounded-md px-3 py-1 text-base text-main transition-colors hover:bg-bg"
                        onClick={() => {
                            PasswordModalRef.open({ workflow: PasswordWorkflow.Change });
                        }}
                    >
                        <span>
                            <Trans>Change password</Trans>
                        </span>
                        <RightArrowIcon width={24} height={24} />
                    </ClickableButton>
                    <ClickableButton
                        className="-mx-3 mt-2 flex w-full items-center justify-between rounded-md px-3 py-1 text-base text-main transition-colors hover:bg-bg"
                        onClick={() => {
                            PasswordModalRef.open({ workflow: PasswordWorkflow.Reset });
                        }}
                    >
                        <span>
                            <Trans>Reset password</Trans>
                        </span>
                        <RightArrowIcon width={24} height={24} />
                    </ClickableButton>
                </div>
            ) : null}
        </ContentCard>
    );
});
