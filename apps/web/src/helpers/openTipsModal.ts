import { dispatchModalEvent } from '@/helpers/dispatchModalEvent.js';
import type { TipsModalOpenProps } from '@/modals/TipsModal/refs.js';

export function openTipsModal(props: TipsModalOpenProps) {
    dispatchModalEvent('tips-modal', 'open', props);
}

export function closeTipsModal() {
    dispatchModalEvent('tips-modal', 'close', undefined);
}
