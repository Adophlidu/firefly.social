import { SingletonModal } from '@/libs/SingletonModal.js';
import type {
    RelayConfirmationPopoverCloseProps,
    RelayConfirmationPopoverOpenProps,
} from '@/modals/FrameViewerModal/RelayConfirmationPopover.js';
import type { TransactionSimulationPopoverProps } from '@/modals/FrameViewerModal/TransactionSimulationPopover.js';

export const TransactionSimulationPopoverRef = new SingletonModal<TransactionSimulationPopoverProps, boolean>();
export const RelayConfirmationPopoverRef = new SingletonModal<
    RelayConfirmationPopoverOpenProps,
    RelayConfirmationPopoverCloseProps
>();
