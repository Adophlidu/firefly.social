import type { NetworkPluginID } from '@/constants/enum.js';
import type { NetworkDescriptor } from '@/web3-shared/base/specs.js';
import type { Web3Definition as Web3DefinitionEVM } from '@/web3-shared/evm/types.js';
import type { Web3Definition as Web3DefinitionSolana } from '@/web3-shared/solana/types.js';

export declare namespace Web3Helper {
    export interface Definition {
        [NetworkPluginID.PLUGIN_EVM]: Web3DefinitionEVM;
        [NetworkPluginID.PLUGIN_SOLANA]: Web3DefinitionSolana;
    }

    export type Web3NetworkDescriptor<T extends NetworkPluginID = never> = T extends never
        ? never
        : NetworkDescriptor<Definition[T]['ChainId'], Definition[T]['NetworkType']>;

    export type ChainIdAll = Definition[NetworkPluginID]['ChainId'];
}
