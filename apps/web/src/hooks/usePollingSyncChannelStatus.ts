import { safeUnreachable } from '@dimensiondev/utils';
import { t } from '@lingui/core/macro';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

import { enqueueWarningMessage } from '@/helpers/enqueueMessage.js';
import { useCallbackRef } from '@/hooks/useCallbackRef.js';
import { getSyncChannelStatus } from '@/providers/firefly/endpoint/getSyncChannelStatus.js';
import { DesktopSyncChannelStatus } from '@/providers/types/Firefly.js';

interface SyncChannelStatusData {
    status: DesktopSyncChannelStatus;
}

export interface UsePollingSyncChannelStatusOptions {
    enabled?: boolean;
    session?: string;
    onScanned?: () => void;
    onSuccess?: () => void;
    onCancel?: () => void;
    onExpired?: () => void;
}

export function usePollingSyncChannelStatus(options: UsePollingSyncChannelStatusOptions) {
    const { enabled = true, session, onScanned, onCancel, onExpired } = options;

    const onScannedRef = useCallbackRef(onScanned);
    const onCancelRef = useCallbackRef(onCancel);
    const onExpiredRef = useCallbackRef(onExpired);

    const { data } = useQuery<SyncChannelStatusData | null>({
        queryKey: ['sync-channel-status', session],
        queryFn() {
            if (!session) return null;
            return getSyncChannelStatus(session);
        },
        refetchInterval(query) {
            const status = query.state.data?.status;
            // Stop polling when we reach a terminal state
            if (
                status === DesktopSyncChannelStatus.Expired ||
                status === DesktopSyncChannelStatus.Cancel ||
                status === DesktopSyncChannelStatus.DataReady
            ) {
                return false;
            }
            return 1000 * 2; // Poll every 2 seconds
        },
        enabled: !!session && enabled,
    });

    // tracks the last (session, status) pair we've already reacted to, so a status
    // that keeps polling the same value (e.g. Scanned) doesn't re-fire callbacks every tick
    const handledRef = useRef<{ session?: string; status: DesktopSyncChannelStatus | null }>({
        session: undefined,
        status: null,
    });

    useEffect(() => {
        if (!enabled || !data) return;
        const status = data?.status;

        if (!status) return;
        if (handledRef.current.session === session && handledRef.current.status === status) return;
        handledRef.current = { session, status };

        switch (status) {
            case DesktopSyncChannelStatus.Scanned:
                onScannedRef.current?.();
                return;
            case DesktopSyncChannelStatus.Cancel:
                enqueueWarningMessage(t`Mobile QR login is interrupted. Please try again.`);
                onCancelRef.current?.();
                return;
            case DesktopSyncChannelStatus.Expired:
                enqueueWarningMessage(t`This QR code is no longer valid. Please scan a new one to continue.`);
                onExpiredRef.current?.();
                return;
            case DesktopSyncChannelStatus.Pending:
            case DesktopSyncChannelStatus.Confirmed:
            case DesktopSyncChannelStatus.DataReady:
                // Do nothing, keep polling
                return;
            default:
                safeUnreachable(status);
        }
    }, [enabled, data, session, onScannedRef, onCancelRef, onExpiredRef]);

    return {
        data,
    };
}
