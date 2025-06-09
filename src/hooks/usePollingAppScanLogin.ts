import { t } from '@lingui/core/macro';
import { safeUnreachable } from '@masknet/kit';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { useAsyncFn } from 'react-use';

import { UserRejectionError } from '@/constants/error.js';
import { enqueueErrorMessage } from '@/helpers/enqueueMessage.js';
import { getErrorMessageFromError } from '@/helpers/getSnackbarMessageFromError.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import { DesktopLinkInfoStatus, type DesktopLinkInfoStatusData } from '@/providers/types/Firefly.js';
import { loginWithAppScan } from '@/services/loginWithAppScan.js';

export function usePollingAppScanLogin(
    otp?: string,
    session?: string,
    options?: {
        enabled?: boolean;
        onBeforeAddAccounts?: () => void;
        onSuccess?: () => void;
        onFailure?: (error: unknown) => void;
        onCancel?: () => void;
        onExpired?: () => void;
    },
) {
    const enabled = options?.enabled ?? true;
    const onBeforeAddAccounts = options?.onBeforeAddAccounts;
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
        refetchInterval(query) {
            if (query.state.data?.status === DesktopLinkInfoStatus.Expired) return false;
            return 1000 * 5;
        },
        enabled: !!session,
    });
    const isLoadingRef = useRef(false);

    const [{ loading }, login] = useAsyncFn(
        async (data: DesktopLinkInfoStatusData, otp: string) => {
            if (data?.status !== DesktopLinkInfoStatus.Confirm || !otp || !data?.encryptedData) return;
            if (isLoadingRef.current) return;
            try {
                isLoadingRef.current = true;
                await loginWithAppScan(data, otp, { onBeforeAddAccounts });
                onSuccess?.();
            } catch (error) {
                enqueueErrorMessage(getErrorMessageFromError(error, t`Failed to login.`));
                onFailure?.(error);
                throw error;
            } finally {
                isLoadingRef.current = false;
            }
        },
        [onBeforeAddAccounts, onSuccess, onFailure],
    );

    useEffect(() => {
        if (!enabled || !data) return;
        const status = data.status;
        switch (status) {
            case DesktopLinkInfoStatus.Confirm:
                if (data?.encryptedData && otp) login(data, otp);
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
