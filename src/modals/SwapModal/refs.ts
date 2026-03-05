import { SingletonModal, type SingletonModalRefCreator } from '@/libs/SingletonModal.js';
import { type SwapModalOpenProps } from '@/modals/SwapModal/SwapModalContent.js';

export type { SwapModalOpenProps };

export type SwapModalRefType = SingletonModalRefCreator<SwapModalOpenProps>;

export const SwapModalRef = new SingletonModal<SwapModalOpenProps>();
