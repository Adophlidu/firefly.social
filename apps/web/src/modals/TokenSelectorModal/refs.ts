import type { NetworkType } from '@dimensiondev/enums';
import type { EthereumSchemaType } from '@dimensiondev/web3/enums';
import type { FungibleToken } from '@dimensiondev/web3/types';

import { SingletonModal, type SingletonModalRefCreator } from '@/libs/SingletonModal.js';
import type { Token } from '@/providers/types/Transfer.js';

export interface TokenSelectorModalOpenProps {
    address: string;
    networkType: NetworkType;
    disableBackdropClose?: boolean;
    isSelected?: (item: Token) => boolean;
    initialAddTokenChainId?: number;
    isConnectRequest?: boolean;
    validChainIds?: number[];
}

export type TokenSelectorModalCloseProps = FungibleToken<number, EthereumSchemaType> | null;

export type TokenSelectorModalRefType = SingletonModalRefCreator<
    TokenSelectorModalOpenProps,
    TokenSelectorModalCloseProps
>;

export const TokenSelectorModalRef = new SingletonModal<TokenSelectorModalOpenProps, TokenSelectorModalCloseProps>();
