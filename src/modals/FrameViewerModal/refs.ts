import { SingletonModal, type SingletonModalRefCreator } from '@/libs/SingletonModal.js';
import {
    type FrameViewerModalCloseProps,
    type FrameViewerModalOpenProps,
} from '@/modals/FrameViewerModal/FrameViewerModalContent.js';

export type { FrameViewerModalCloseProps, FrameViewerModalOpenProps };

export type FrameViewerModalRefType = SingletonModalRefCreator<FrameViewerModalOpenProps>;

export const FrameViewerModalRef = new SingletonModal<FrameViewerModalOpenProps, FrameViewerModalCloseProps>();
