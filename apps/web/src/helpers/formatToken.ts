import { NetworkType, TokenType } from '@dimensiondev/enums';
import { isValidChainIdSolana } from '@dimensiondev/web3/chains';
import { ETH_ZERO_ADDRESS } from '@dimensiondev/web3/constants';
import { EthereumSchemaType } from '@dimensiondev/web3/enums';
import type { FungibleToken } from '@dimensiondev/web3/types';
import { isNativeTokenDebank, isValidAddressEthereum } from '@dimensiondev/web3/utils';

import type { Token } from '@/providers/types/Transfer.js';

export function formatDebankTokenToFungibleToken(token: Token): FungibleToken<number, number> {
    // it is not a valid address if its native token
    const address =
        token.networkType === NetworkType.Solana
            ? token.id
            : isValidAddressEthereum(token.id)
              ? token.id
              : ETH_ZERO_ADDRESS;

    return {
        name: token.name,
        symbol: token.symbol,
        decimals: token.decimals,
        logoURL: token.logo_url,
        id: address,
        chainId: token.chainId,
        type: TokenType.Fungible,
        schema: isNativeTokenDebank(token) ? EthereumSchemaType.Native : EthereumSchemaType.ERC20,
        address,
    } as FungibleToken<number, EthereumSchemaType>;
}

export function formatFungibleTokenToDebankToken(token: FungibleToken<number, number>) {
    return {
        name: token.name,
        symbol: token.symbol,
        decimals: token.decimals,
        logo_url: token.logoURL,
        id: token.id,
        chainId: token.chainId,
        networkType: isValidChainIdSolana(token.chainId) ? NetworkType.Solana : NetworkType.Ethereum,
    } as Token;
}
