import { type BigNumber } from 'bignumber.js';
import { type Connector } from 'wagmi';

import { type NetworkType } from '@/constants/enum.js';

export interface Token<ChainIdLike = number, AddressLike = string> {
    chainId: ChainIdLike;
    balance: string;
    usdValue: number;
    chainLogoUrl?: string;
    networkType: NetworkType;
    custom?: boolean;
    amount: number;
    chain: string;
    decimals: number;
    displaySymbol: string | null;
    id: AddressLike;
    isCore: boolean;
    isVerified: boolean;
    isWallet: boolean;
    logoUrl: string;
    name: string;
    optimizedSymbol: string;
    price: string | number;
    price24hChange: number;
    protocolId: string;
    rawAmount: string;
    rawAmountHexStr: string;
    symbol: string;
    timeAt: number;
}

export interface TransactionOptions<ChainIdLike = number, AddressLike = string> {
    to: AddressLike;
    amount: string;
    token: Pick<Token<ChainIdLike, AddressLike>, 'chainId' | 'id' | 'decimals'>;
    connector?: Connector;
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
