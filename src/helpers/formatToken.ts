import { type FungibleToken } from '@masknet/web3-shared-base';
import { type ChainId, SchemaType, ZERO_ADDRESS } from '@masknet/web3-shared-evm';
import { isValidChainId as isValidSolanaChainId } from '@masknet/web3-shared-solana';
import { isAddress } from 'viem';

import { NetworkType, TokenType } from '@/constants/enum.js';
import { isNativeToken } from '@/providers/ethereum/isNativeToken.js';
import type { Token } from '@/providers/types/Transfer.js';

export function formatDebankTokenToFungibleToken(token: Token): FungibleToken<number, number> {
    // it is not a valid address if its native token
    const address = token.networkType === NetworkType.Solana ? token.id : isAddress(token.id) ? token.id : ZERO_ADDRESS;

    return {
        name: token.name,
        symbol: token.symbol,
        decimals: token.decimals,
        logoURL: token.logo_url,
        id: address,
        chainId: token.chainId,
        type: TokenType.Fungible,
        schema: isNativeToken(token) ? SchemaType.Native : SchemaType.ERC20,
        address,
    } as FungibleToken<ChainId, SchemaType>;
}

export function formatFungibleTokenToDebankToken(token: FungibleToken<number, number>) {
    return {
        name: token.name,
        symbol: token.symbol,
        decimals: token.decimals,
        logo_url: token.logoURL,
        id: token.id,
        chainId: token.chainId,
        networkType: isValidSolanaChainId(token.chainId) ? NetworkType.Solana : NetworkType.Ethereum,
    } as Token;
}
