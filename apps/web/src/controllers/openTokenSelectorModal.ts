import { openAndWaitForCloseModalEvent } from '@/controllers/dispatchModalEvent.js';
import type { TokenSelectorModalCloseProps, TokenSelectorModalOpenProps } from '@/modals/TokenSelectorModal/refs.js';

export function openAndWaitForCloseTokenSelectorModal(props: TokenSelectorModalOpenProps) {
    return openAndWaitForCloseModalEvent('token-selector-modal', props) as Promise<TokenSelectorModalCloseProps>;
}
