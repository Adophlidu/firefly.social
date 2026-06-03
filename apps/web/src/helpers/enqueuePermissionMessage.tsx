import { PermissionSnackbar } from '@/components/PermissionSnackbar.js';
import type { SnackbarKey } from '@/components/Snackbar.js';
import { openSnackbar } from '@/controllers/openSnackbar.js';

export function enqueuePermissionMessage(rejected: boolean, onEnable?: () => void) {
    openSnackbar({
        message: `Notification permission - ${rejected ? 'Denied' : 'Granted'}`,
        options: {
            key: `notification-${rejected ? 'denied' : 'granted'}`,
            autoHide: false,
            preventDuplicate: true,
            content: (key: SnackbarKey) => <PermissionSnackbar id={key} rejected={rejected} onEnable={onEnable} />,
        },
    });
}
