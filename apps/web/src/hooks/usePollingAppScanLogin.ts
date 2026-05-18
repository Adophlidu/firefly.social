import { AsyncStatus, Source } from '@dimensiondev/enums';
import { safeUnreachable } from '@dimensiondev/utils';
import { t } from '@lingui/core/macro';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useAsyncFn } from 'react-use';

import { enqueueErrorMessage, enqueueWarningMessage } from '@/helpers/enqueueMessage.js';
import { getErrorMessageFromError } from '@/helpers/getSnackbarMessageFromError.js';
import { useCallbackRef } from '@/hooks/useCallbackRef.js';
import { getDesktopStatus } from '@/providers/firefly/endpoint/getDesktopStatus.js';
import { DesktopLinkInfoStatus, type DesktopLinkInfoStatusData } from '@/providers/types/Firefly.js';
import { loginWithAppScan } from '@/services/loginWithAppScan.js';
import { useGlobalState } from '@/store/useGlobalStore.js';

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
    const onSuccessRef = useCallbackRef(options?.onSuccess);
    const onFailureRef = useCallbackRef(options?.onFailure);
    const onCancelRef = useCallbackRef(options?.onCancel);
    const onExpiredRef = useCallbackRef(options?.onExpired);

    const { setAsyncStatus } = useGlobalState();

    const { data } = useQuery({
        queryKey: ['desktop-session-status', session],
        queryFn() {
            if (!session) return;
            return getDesktopStatus(session);
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
                setAsyncStatus(Source.Firefly, AsyncStatus.Pending);

                const isSigned = await loginWithAppScan(data, otp);
                if (isSigned) onSuccessRef.current?.();
                else onCancelRef.current?.();
            } catch (error) {
                enqueueErrorMessage(getErrorMessageFromError(error, t`Failed to login.`));
                onFailureRef.current?.(error);
                throw error;
            } finally {
                setAsyncStatus(Source.Firefly, AsyncStatus.Idle);
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
                enqueueWarningMessage(t`Mobile QR login is interrupted. Please try again.`);
                onCancelRef.current?.();
                return;
            case DesktopLinkInfoStatus.Expired:
                enqueueWarningMessage(t`This QR code is no longer valid. Please scan a new one to continue.`);
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
