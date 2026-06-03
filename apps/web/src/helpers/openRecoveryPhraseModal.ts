import { dispatchModalEvent } from '@/helpers/dispatchModalEvent.js';
import type { RecoveryPhraseModalOpenProps } from '@/modals/RecoveryPhraseModal/refs.js';

export function openRecoveryPhraseModal(props: RecoveryPhraseModalOpenProps) {
    dispatchModalEvent('recovery-phrase-modal', 'open', props);
}
