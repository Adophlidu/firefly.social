import { t } from '@lingui/core/macro';
import { safeUnreachable } from '@masknet/kit';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useAsyncFn } from 'react-use';

import { UserRejectionError } from '@/constants/error.js';
import { enqueueErrorMessage } from '@/helpers/enqueueMessage.js';
import { getErrorMessageFromError } from '@/helpers/getSnackbarMessageFromError.js';
import { useCallbackRef } from '@/hooks/useCallbackRef.js';
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
    const onBeforeAddAccountsRef = useCallbackRef(options?.onBeforeAddAccounts);
    const onSuccessRef = useCallbackRef(options?.onSuccess);
    const onFailureRef = useCallbackRef(options?.onFailure);
    const onCancelRef = useCallbackRef(options?.onCancel);
    const onExpiredRef = useCallbackRef(options?.onExpired);

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

    const [{ loading }, login] = useAsyncFn(
        async (data: DesktopLinkInfoStatusData, otp: string) => {
            if (data?.status !== DesktopLinkInfoStatus.Confirm || !otp || !data?.encryptedData) return;
            try {
                await loginWithAppScan(data, otp, { onBeforeAddAccounts: () => onBeforeAddAccountsRef.current?.() });
                onSuccessRef.current?.();
            } catch (error) {
                enqueueErrorMessage(getErrorMessageFromError(error, t`Failed to login.`));
                onFailureRef.current?.(error);
                throw error;
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [],
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
                onCancelRef.current?.();
                return;
            case DesktopLinkInfoStatus.Expired:
                enqueueErrorMessage(t`Login session expired.`);
                onExpiredRef.current?.();
                return;
            case DesktopLinkInfoStatus.Pending:
                break;
            default:
                safeUnreachable(status);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enabled, login, otp, data]);

    return { loading };
}
