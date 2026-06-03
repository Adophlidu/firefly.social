import { dispatchModalEvent, openAndWaitForCloseModalEvent } from '@/controllers/dispatchModalEvent.js';
import type { ComposeModalCloseProps, ComposeModalOpenProps } from '@/modals/ComposeModal/types.js';

export function openComposeModal(props: ComposeModalOpenProps) {
    dispatchModalEvent('compose-modal', 'open', props);
}

export function closeComposeModal(props?: ComposeModalCloseProps) {
    dispatchModalEvent('compose-modal', 'close', props);
}

export function openAndWaitForCloseComposeModal(props: ComposeModalOpenProps) {
    return openAndWaitForCloseModalEvent('compose-modal', props) as Promise<ComposeModalCloseProps>;
}
