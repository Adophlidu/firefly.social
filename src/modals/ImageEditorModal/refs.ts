import { type ImageEditorContentProps } from '@/components/ImageEditorContent.js';
import { SingletonModal, type SingletonModalRefCreator } from '@/libs/SingletonModal.js';

export type ImageEditorModalOpenProps = Omit<ImageEditorContentProps, 'open' | 'onSave' | 'onClose'>;

export type ImageEditorModalCloseProps = File | null;

export type ImageEditorModalRefType = SingletonModalRefCreator<ImageEditorModalOpenProps, ImageEditorModalCloseProps>;

export const ImageEditorModalRef = new SingletonModal<ImageEditorModalOpenProps, ImageEditorModalCloseProps>();
