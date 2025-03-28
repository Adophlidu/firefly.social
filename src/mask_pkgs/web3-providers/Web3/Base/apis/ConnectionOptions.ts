import {
    EthereumChainId,
    getDefaultChainId,
    getDefaultProviderType,
    ProviderType,
    type Transaction,
} from '@masknet/web3-shared-evm';
import { identity, pickBy } from 'lodash-es';

import type { GasOptionType } from '@/mask_pkgs/web3-shared/base/index.js';
import type { PartialRequired } from '@/types/index.js';

export interface BaseConnectionOptions {
    /** Designate the signer of the transaction. */
    account?: string;
    /** Designate the sub-network id of the transaction. */
    chainId?: EthereumChainId;
    /** Designate the provider to handle the transaction. */
    providerType?: ProviderType;
    /** Custom network rpc url. */
    providerURL?: string;
    /** Gas payment token. */
    paymentToken?: string;
    /** Accessing data from chain directly w/o middleware, the default value is true  */
    readonly?: boolean;
    /** Fragments to merge into the transaction. */
    overrides?: Partial<Transaction>;
    /** Gas option type */
    gasOptionType?: GasOptionType;
}

export class ConnectionOptions {
    static fill(
        initials?: BaseConnectionOptions,
    ): PartialRequired<BaseConnectionOptions, 'account' | 'chainId' | 'providerType'> {
        return {
            account: '',
            chainId: getDefaultChainId(),
            providerType: getDefaultProviderType(),
            ...pickBy(initials, identity),
            overrides: {
                ...pickBy(initials?.overrides, identity),
            } as Partial<Transaction>,
        };
    }
}
