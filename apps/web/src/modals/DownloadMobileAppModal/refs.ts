import { SingletonModal, type SingletonModalRefCreator } from '@/libs/SingletonModal.js';

export type DownloadMobileAppModalRefType = SingletonModalRefCreator;

export const DownloadMobileAppModalRef = new SingletonModal();
