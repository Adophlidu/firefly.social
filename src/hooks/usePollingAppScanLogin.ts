import { t } from '@lingui/core/macro';
import { safeUnreachable } from '@masknet/kit';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useAsyncFn } from 'react-use';

import { UserRejectionError } from '@/constants/error.js';
import { enqueueErrorMessage } from '@/helpers/enqueueMessage.js';
import { getErrorMessageFromError } from '@/helpers/getSnackbarMessageFromError.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import { DesktopLinkInfoStatus } from '@/providers/types/Firefly.js';
import { loginWithAppScan } from '@/services/loginWithAppScan.js';

export function usePollingAppScanLogin(
    otp?: string,
    session?: string,
    options?: {
        enabled?: boolean;
        onSuccess?: () => void;
        onFailure?: (error: unknown) => void;
        onCancel?: () => void;
        onExpired?: () => void;
    },
) {
    const enabled = options?.enabled ?? true;
    const onSuccess = options?.onSuccess;
    const onFailure = options?.onFailure;
    const onCancel = options?.onCancel;
    const onExpired = options?.onExpired;
    const { data } = useQuery({
        queryKey: ['desktop-session-status', session],
        queryFn() {
            if (!session) return;
            return FireflyEndpointProvider.getDesktopStatus(session);
        },
        refetchInterval: 1000 * 5,
        enabled: !!session,
    });

    const [{ loading }, login] = useAsyncFn(async () => {
        if (!enabled || data?.status !== DesktopLinkInfoStatus.Confirm || !otp || !data?.encryptedData) return;
        try {
            await loginWithAppScan(data, otp);
            onSuccess?.();
        } catch (error) {
            enqueueErrorMessage(getErrorMessageFromError(error, t`Failed to login.`));
            onFailure?.(error);
            throw error;
        }
    }, [enabled, data, otp, onSuccess, onFailure]);

    useEffect(() => {
        if (!enabled || !data) return;
        const status = data.status;
        switch (status) {
            case DesktopLinkInfoStatus.Confirm:
                if (data?.encryptedData && otp) login();
                return;
            case DesktopLinkInfoStatus.Cancel:
                enqueueErrorMessage(getErrorMessageFromError(new UserRejectionError()));
                onCancel?.();
                return;
            case DesktopLinkInfoStatus.Expired:
                enqueueErrorMessage(t`Login session expired.`);
                onExpired?.();
                return;
            case DesktopLinkInfoStatus.Pending:
                break;
            default:
                safeUnreachable(status);
        }
    }, [enabled, login, otp, onCancel, onExpired, data]);

    return { loading };
}
