import { dispatchModalEvent } from '@/helpers/dispatchModalEvent.js';
import type { VerifiedAddressModalProps } from '@/modals/VerifiedAddressModal/refs.js';

export function openVerifiedAddressModal(props: VerifiedAddressModalProps) {
    dispatchModalEvent('verified-address-modal', 'open', props);
}
