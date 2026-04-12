import type { ReactNode } from 'react';

import { SingletonModal, type SingletonModalRefCreator } from '@/libs/SingletonModal.js';

export interface DraggablePopoverProps {
    backdrop?: boolean;
    content?: ReactNode;
    enableOverflow?: boolean;
    onClose?: () => void;
}

export type DraggablePopoverRefType = SingletonModalRefCreator<DraggablePopoverProps>;

export const DraggablePopoverRef = new SingletonModal<DraggablePopoverProps>();
