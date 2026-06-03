import { dispatchModalEvent } from '@/controllers/dispatchModalEvent.js';
import type { FreeMintModalOpenProps } from '@/modals/FreeMintModal/refs.js';

export function openFreeMintModal(props: FreeMintModalOpenProps) {
    dispatchModalEvent('free-mint-modal', 'open', props);
}
