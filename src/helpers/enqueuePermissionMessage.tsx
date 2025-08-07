import { PermissionSnackbar } from '@/components/PermissionSnackbar.js';
import type { SnackbarKey } from '@/components/Snackbar.js';
import { SnackbarRef } from '@/modals/Snackbar.js';

export function enqueuePermissionMessage(rejected: boolean, onEnable?: () => void) {
    SnackbarRef.open({
        message: `Notification permission - ${rejected ? 'Denied' : 'Granted'}`,
        options: {
            preventDuplicate: true,
            autoHideDuration: null,
            variant: 'info',
            content: (key: SnackbarKey) => <PermissionSnackbar id={key} rejected={rejected} onEnable={onEnable} />,
        },
    });
}
