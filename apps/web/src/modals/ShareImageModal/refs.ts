import { SingletonModal, type SingletonModalRefCreator } from '@/libs/SingletonModal.js';

export interface ShareImageModalOpenProps {
    imageUrl: string;
    aspectRatio?: string; // optimize CLS with this
    fileName?: string;
    /** Shows a Copy button (clipboard PNG) when the browser supports it. */
    enableCopy?: boolean;
    /** Shows a Post button; the modal stays open (with a spinner) until it resolves, then closes. */
    onPost?: () => void | Promise<void>;
}

export type ShareImageModalCloseProps = void;

export type ShareImageModalRefType = SingletonModalRefCreator<ShareImageModalOpenProps>;

export const ShareImageModalRef = new SingletonModal<ShareImageModalOpenProps, ShareImageModalCloseProps>();
