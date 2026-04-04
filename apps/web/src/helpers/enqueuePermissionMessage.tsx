import { PermissionSnackbar } from '@/components/PermissionSnackbar.js';
import { type SnackbarKey } from '@/components/Snackbar.js';
import { SnackbarRef } from '@/modals/Snackbar/refs.js';

export function enqueuePermissionMessage(rejected: boolean, onEnable?: () => void) {
    SnackbarRef.open({
        message: `Notification permission - ${rejected ? 'Denied' : 'Granted'}`,
        options: {
            key: `notification-${rejected ? 'denied' : 'granted'}`,
            autoHide: false,
            preventDuplicate: true,
            content: (key: SnackbarKey) => <PermissionSnackbar id={key} rejected={rejected} onEnable={onEnable} />,
        },
    });
}
