import { SingletonModal, type SingletonModalRefCreator } from '@/libs/SingletonModal.js';
import type { PreviewMediaModalContentProps } from '@/modals/PreviewMediaModal/PreviewMediaModalContent.js';

export interface PreviewMediaModalOpenProps extends Omit<PreviewMediaModalContentProps, 'open' | 'onClose'> {}

export type PreviewMediaModalRefType = SingletonModalRefCreator<PreviewMediaModalOpenProps>;

export const PreviewMediaModalRef = new SingletonModal<PreviewMediaModalOpenProps>();
