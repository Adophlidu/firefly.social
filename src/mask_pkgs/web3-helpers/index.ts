import type { NetworkPluginID } from '@masknet/shared-base';
import type { NetworkDescriptor } from '@masknet/web3-shared-base';
import type * as EVM from '@masknet/web3-shared-evm';
import type * as Solana from '@masknet/web3-shared-solana';

export declare namespace Web3Helper {
    export interface Definition {
        [NetworkPluginID.PLUGIN_EVM]: EVM.Web3Definition;
        [NetworkPluginID.PLUGIN_SOLANA]: Solana.Web3Definition;
    }

    export type Web3NetworkDescriptor<T extends NetworkPluginID = never> = T extends never
        ? never
        : NetworkDescriptor<Definition[T]['ChainId'], Definition[T]['NetworkType']>;

    export type ChainIdAll = Definition[NetworkPluginID]['ChainId'];

    export type SchemaTypeAll = Definition[NetworkPluginID]['SchemaType'];

    export type ChainIdScope<
        S extends 'all' | void = void,
        T extends NetworkPluginID = NetworkPluginID,
    > = S extends 'all' ? ChainIdAll : Definition[T]['ChainId'];

    export type SchemaTypeScope<
        S extends 'all' | void = void,
        T extends NetworkPluginID = NetworkPluginID,
    > = S extends 'all' ? SchemaTypeAll : Definition[T]['SchemaType'];
}
