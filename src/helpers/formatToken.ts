import { type EthereumChainId, EthereumSchemaType } from '@masknet/web3-shared-evm';

import { NetworkType, TokenType } from '@/constants/enum.js';
import { isValidAddressEthereum } from '@/helpers/isValidAddress.js';
import { isValidChainIdSolana } from '@/helpers/isValidChainId.js';
import { ETH_ZERO_ADDRESS } from '@/helpers/isZeroAddress.js';
import type { FungibleToken } from '@/mask_pkgs/web3-shared/base/index.js';
import { isNativeToken } from '@/providers/ethereum/isNativeToken.js';
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
        schema: isNativeToken(token) ? EthereumSchemaType.Native : EthereumSchemaType.ERC20,
        address,
    } as FungibleToken<EthereumChainId, EthereumSchemaType>;
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
