import { openAndWaitForCloseModalEvent } from '@/helpers/dispatchModalEvent.js';
import type { DisconnectFireflyAccountModalProps } from '@/modals/DisconnectFireflyAccountModal/refs.js';

export function openAndWaitForCloseDisconnectFireflyAccountModal(props: DisconnectFireflyAccountModalProps) {
    return openAndWaitForCloseModalEvent('disconnect-firefly-account-modal', props) as Promise<void>;
}
