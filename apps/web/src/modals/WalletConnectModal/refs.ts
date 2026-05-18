import type { ClickOrigin } from '@dimensiondev/enums';
import type { NetworkType } from '@dimensiondev/web3/enums';

import { SingletonModal, type SingletonModalRefCreator } from '@/libs/SingletonModal.js';

export interface WalletConnectModalOpenProps {
    origin?: ClickOrigin;
    networkType?: NetworkType;
    customTitle?: string;
}

export interface WalletConnectModalCloseProps {
    networkType: NetworkType;
}

export type WalletConnectModalRefType = SingletonModalRefCreator<
    WalletConnectModalOpenProps | void,
    WalletConnectModalCloseProps | void
>;

export const WalletConnectModalRef = new SingletonModal<
    WalletConnectModalOpenProps | void,
    WalletConnectModalCloseProps | void
>();
