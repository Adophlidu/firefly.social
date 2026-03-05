import { SingletonModal, type SingletonModalRefCreator } from '@/libs/SingletonModal.js';

export interface ShareImageModalOpenProps {
    imageUrl: string;
    aspectRatio?: string; // optimize CLS with this
}

export type ShareImageModalCloseProps = void;

export type ShareImageModalRefType = SingletonModalRefCreator<ShareImageModalOpenProps>;

export const ShareImageModalRef = new SingletonModal<ShareImageModalOpenProps, ShareImageModalCloseProps>();
