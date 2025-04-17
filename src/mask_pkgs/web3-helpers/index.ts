import type { NetworkPluginID } from '@/constants/enum.js';
import type { NetworkDescriptor } from '@/mask_pkgs/web3-shared/base/index.js';
import type * as EVM from '#masknet/web3-shared-evm';
import type * as Solana from '#masknet/web3-shared-solana';

export declare namespace Web3Helper {
    export interface Definition {
        [NetworkPluginID.PLUGIN_EVM]: EVM.Web3Definition;
        [NetworkPluginID.PLUGIN_SOLANA]: Solana.Web3Definition;
    }

    export type Web3NetworkDescriptor<T extends NetworkPluginID = never> = T extends never
        ? never
        : NetworkDescriptor<Definition[T]['ChainId'], Definition[T]['NetworkType']>;

    export type ChainIdAll = Definition[NetworkPluginID]['ChainId'];
}
