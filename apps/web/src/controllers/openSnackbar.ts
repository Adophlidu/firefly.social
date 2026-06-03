import { dispatchModalEvent } from '@/controllers/dispatchModalEvent.js';
import type { SnackbarCloseProps, SnackbarOpenProps } from '@/modals/Snackbar/refs.js';

export function openSnackbar(props: SnackbarOpenProps) {
    dispatchModalEvent('snackbar', 'open', props);
}

export function closeSnackbar(props?: SnackbarCloseProps) {
    dispatchModalEvent('snackbar', 'close', props);
}
