import { dispatchModalEvent } from '@/controllers/dispatchModalEvent.js';
import type { DraggablePopoverProps } from '@/modals/DraggablePopover/refs.js';

export function openDraggablePopover(props: DraggablePopoverProps) {
    dispatchModalEvent('draggable-popover', 'open', props);
}

export function closeDraggablePopover() {
    dispatchModalEvent('draggable-popover', 'close', undefined);
}
