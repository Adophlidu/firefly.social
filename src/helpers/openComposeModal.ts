import { dispatchModalEvent } from '@/helpers/dispatchModalEvent.js';
import { type ComposeModalOpenProps } from '@/modals/ComposeModal/types.js';

export function openComposeModal(props: ComposeModalOpenProps) {
    dispatchModalEvent('compose-modal', 'open', props);
}
