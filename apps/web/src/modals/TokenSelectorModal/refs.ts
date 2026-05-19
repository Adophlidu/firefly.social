import type { NetworkType } from '@dimensiondev/enums';

import { SingletonModal, type SingletonModalRefCreator } from '@/libs/SingletonModal.js';
import type { Token } from '@/providers/types/Transfer.js';
import type { FungibleToken } from '@/web3-shared/base/specs.js';
import type { EthereumSchemaType } from '@/web3-shared/evm/types.js';

export interface TokenSelectorModalOpenProps {
    address: string;
    networkType: NetworkType;
    disableBackdropClose?: boolean;
    isSelected?: (item: Token) => boolean;
    initialAddTokenChainId?: number;
    isConnectRequest?: boolean;
    validChainIds?: number[];
}

export type TokenSelectorModalCloseProps = FungibleToken<number, EthereumSchemaType, Token> | null;

export type TokenSelectorModalRefType = SingletonModalRefCreator<
    TokenSelectorModalOpenProps,
    TokenSelectorModalCloseProps
>;

export const TokenSelectorModalRef = new SingletonModal<TokenSelectorModalOpenProps, TokenSelectorModalCloseProps>();
