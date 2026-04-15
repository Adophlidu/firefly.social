import { ETH_ZERO_ADDRESS, isValidAddressEthereum } from '@dimensiondev/web3/utils';

import { NetworkType, TokenType } from '@/constants/enum.js';
import { isValidChainIdSolana } from '@/helpers/isValidChainId.js';
import { isNativeTokenDebank } from '@/providers/ethereum/isNativeTokenDebank.js';
import type { Token } from '@/providers/types/Transfer.js';
import type { FungibleToken } from '@/web3-shared/base/specs.js';
import { type EthereumChainId, EthereumSchemaType } from '@/web3-shared/evm/types.js';

export function formatDebankTokenToFungibleToken(token: Token): FungibleToken<number, number, Token> {
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
        __original__: token,
    } as FungibleToken<EthereumChainId, EthereumSchemaType, Token>;
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
