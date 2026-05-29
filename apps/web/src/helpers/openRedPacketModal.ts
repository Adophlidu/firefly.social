import { dispatchModalEvent, openAndWaitForCloseModalEvent } from '@/helpers/dispatchModalEvent.js';
import type { RedPacketModalCloseProps, RedPacketModalOpenProps } from '@/modals/RedPacketModal/refs.js';

export function openRedPacketModal(props?: RedPacketModalOpenProps) {
    dispatchModalEvent('red-packet-modal', 'open', props);
}

export function closeRedPacketModal(result?: RedPacketModalCloseProps) {
    dispatchModalEvent('red-packet-modal', 'close', result);
}

export function openAndWaitForCloseRedPacketModal(props?: RedPacketModalOpenProps) {
    return openAndWaitForCloseModalEvent('red-packet-modal', props) as Promise<RedPacketModalCloseProps>;
}
