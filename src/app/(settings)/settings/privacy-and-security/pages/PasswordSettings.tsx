import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { memo } from 'react';
import { useAsyncFn } from 'react-use';

import { ContentCard } from '@/app/(settings)/settings/privacy-and-security/pages/ContentCard.js';
import RightArrowIcon from '@/assets/right-arrow.svg';
import { ClickableButton } from '@/components/ClickableButton.js';
import { Switch } from '@/components/Switch/index.js';
import { queryClient } from '@/configs/queryClient.js';
import { PasswordWorkflow } from '@/constants/enum.js';
import { enqueueErrorMessage, enqueueSuccessMessage } from '@/helpers/enqueueMessage.js';
import { openLoginModal } from '@/helpers/openLoginModal.js';
import { useIsLoginFirefly } from '@/hooks/useIsLoginFirefly.js';
import { ConfirmModalRef } from '@/modals/ConfirmModal.js';
import { PasswordModalRef } from '@/modals/PasswordModal/index.js';
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
                    openLoginModal();
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
                        className="mt-4 flex h-6 w-full items-center justify-between text-base text-main"
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
                        className="mt-4 flex h-6 w-full items-center justify-between text-base text-main"
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
