import type { NetworkType } from '@dimensiondev/web3/enums';
import type { BigNumber } from 'bignumber.js';

import type { Token as DebankToken } from '@/providers/types/Debank.js';

export type Token<ChainIdLike = number, AddressLike = string> = DebankToken<AddressLike> & {
    chainId: ChainIdLike;
    balance: string;
    usdValue: number;
    chainLogoUrl?: string;
    networkType: NetworkType;
    custom?: boolean;
};

export interface TransactionOptions<ChainIdLike = number, AddressLike = string> {
    to: AddressLike;
    amount: string;
    token: Token<ChainIdLike, AddressLike>;
}

export interface GetDefaultGasOptions<ChainIdLike = number, AddressLike = string> {
    to: AddressLike;
    amount: string;
    token: Pick<Token<ChainIdLike, AddressLike>, 'chainId' | 'id' | 'decimals'>;
}

export interface TransferProvider<ChainIdLike = number, AddressLike = string, HashLike = string> {
    transfer: (options: TransactionOptions<ChainIdLike, AddressLike>) => Promise<HashLike>;
    isNativeToken: (token: Token<ChainIdLike, AddressLike>) => boolean;
    validateBalance: (options: TransactionOptions<ChainIdLike, AddressLike>) => Promise<boolean>;
    validateGas: (options: TransactionOptions<ChainIdLike, AddressLike>) => Promise<{
        isValid: boolean;
        gas: BigNumber;
    }>;
    getAvailableBalance: (options: TransactionOptions<ChainIdLike, AddressLike>) => Promise<string>;
    waitForTransaction: (hash: HashLike, chainId: number) => Promise<void>;
}
