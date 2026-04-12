import { SingletonModal } from '@/libs/SingletonModal.js';
import type { ComposeModalCloseProps, ComposeModalOpenProps } from '@/modals/ComposeModal/types.js';

export enum CloseAction {
    Saved = 'saved',
    Discard = 'discard',
    None = 'none',
}

export const ComposeModalRef = new SingletonModal<ComposeModalOpenProps, ComposeModalCloseProps>();
