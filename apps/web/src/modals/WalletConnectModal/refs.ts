import type { ClickOrigin, NetworkType } from '@dimensiondev/enums';

import { SingletonModal, type SingletonModalRefCreator } from '@/libs/SingletonModal.js';

export interface WalletConnectModalOpenProps {
    origin?: ClickOrigin;
    networkType?: NetworkType;
    customTitle?: string;
    /**
     * Invoked while the just-selected wallet is still connected, before the modal
     * closes. The EVM connection is torn down on close (MetaMask emits
     * accountsChanged([]) → wagmi disconnect), so any operation that needs the live
     * connection — e.g. signing to bind the wallet — must run inside this callback.
     * `caipAddress` is the CAIP-10 address (e.g. `eip155:1:0x…`) ConnectingView
     * observed. Optional; omitted by callers that only need the selected network.
     */
    onConnect?: (networkType: NetworkType, caipAddress: string) => Promise<void> | void;
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
