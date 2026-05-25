import { Md5 } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { useAsyncFn } from 'react-use';
import { toast } from 'sonner';

import { ClickableButton } from '@/components/ClickableButton.js';
import { Confirm } from '@/components/ConfirmModal.js';
import { Loading } from '@/components/Loading.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { Switch } from '@/components/ui/switch.js';
import { queryClient } from '@/configs/queryClient.js';
import { PinCodeWorkflow } from '@/constants/pinCode.js';
import { desensitizeEmail } from '@/helpers/desensitizeEmail.js';
import { runPinCodeWorkflow } from '@/helpers/runPinCodeWorkflow.js';
import { useIsLoginFirefly } from '@/hooks/useIsLogin.js';
import { logger } from '@/lib/Logger.js';
import { getSecuritySettingsQuery } from '@/queries/firefly/getSecuritySettingsQuery.js';
import { getFireflyEndpoint } from '@/store/fireflyEndpoint.js';

export function SecuritySettings() {
    const isLogin = useIsLoginFirefly();
    const { data, isLoading, isRefetching } = useQuery({
        ...getSecuritySettingsQuery(),
        enabled: isLogin,
        staleTime: 1000 * 60 * 1, // 1 minute
    });

    const [{ loading }, togglePinCode] = useAsyncFn(
        async (checked: boolean) => {
            try {
                const pinCode = data?.is_set_pin_code
                    ? await runPinCodeWorkflow(PinCodeWorkflow.Authenticate)
                    : await runPinCodeWorkflow(PinCodeWorkflow.Create);
                if (pinCode === null) return;
                if (!pinCode) throw new Error('Failed PIN code attempt');

                await getFireflyEndpoint().updatePinCodeEnableStatus(Md5.hashStr(pinCode), checked);

                queryClient.refetchQueries({ queryKey: getSecuritySettingsQuery().queryKey });
            } catch (error) {
                logger.error('Failed to toggle pin code', error);
                toast.error(
                    checked ? (
                        <Trans>Failed to enable authentication</Trans>
                    ) : (
                        <Trans>Failed to disable authentication</Trans>
                    ),
                );
            }
        },
        [data?.is_set_pin_code],
    );

    const [{ loading: resetLoading }, resetPinCode] = useAsyncFn(async () => {
        const confirmed = await Confirm.call({
            title: <Trans>Reset PIN Code</Trans>,
            message: (
                <p>
                    <Trans>
                        Confirm to reset PIN code? For your security, this action requires sending a verification code
                        to your recovery email to confirm your identity.
                    </Trans>
                </p>
            ),
            buttonLabel: <Trans>Confirm</Trans>,
            buttonVariants: 'primary',
        });
        if (!confirmed) return;

        runPinCodeWorkflow(PinCodeWorkflow.ResetPinCode, data?.email);
    }, [data?.email]);

    const [{ loading: resetEmailLoading }, resetEmail] = useAsyncFn(async () => {
        await runPinCodeWorkflow(PinCodeWorkflow.ResetEmail, data?.email);
        queryClient.refetchQueries({ queryKey: getSecuritySettingsQuery().queryKey });
    }, [data?.email]);

    if (!isLogin)
        return (
            <div className="flex h-full min-h-52 items-center justify-center">
                <Trans>Please login to view security settings.</Trans>
            </div>
        );
    if (isLoading) return <Loading />;

    const enabled = data?.enable ?? false;
    const disabled = !enabled || loading || isRefetching;

    return (
        <div className="space-y-4">
            <div className="bg-lightBg flex h-12 items-center justify-between rounded-2xl px-3">
                <span className="text-main text-sm font-medium">
                    <Trans>Enable authentication</Trans>
                </span>
                {loading || isRefetching ? (
                    <LoadingIcon />
                ) : (
                    <Switch checked={enabled} onCheckedChange={togglePinCode} />
                )}
            </div>
            <ClickableButton
                disabled={disabled || resetLoading}
                className="bg-lightBg text-highlight h-12 w-full rounded-2xl px-3 text-left text-sm font-medium"
                onClick={disabled ? undefined : resetPinCode}
            >
                <Trans>Reset PIN Code</Trans>
            </ClickableButton>
            <div className="bg-lightBg w-full overflow-hidden rounded-2xl">
                <div className="flex h-12 items-center justify-between px-3">
                    <span className="text-main text-sm font-medium">
                        <Trans>Recovery Email</Trans>
                    </span>
                    <span className="text-second text-[13px]">{data?.email ? desensitizeEmail(data.email) : ''}</span>
                </div>
                <ClickableButton
                    disabled={disabled || resetEmailLoading}
                    className="bg-lightBg text-highlight h-12 w-full border-t border-[#CFCFCF] px-3 text-left text-sm font-medium"
                    onClick={resetEmail}
                >
                    <Trans>Change Email</Trans>
                </ClickableButton>
            </div>
        </div>
    );
}
