import { NetworkType } from '@dimensiondev/enums';
import { isValidChainIdEthereum, resolveDebankChain, solana } from '@dimensiondev/web3/chains';
import {
    ETH_NATIVE_TOKEN_ADDRESS,
    ETH_ZERO_ADDRESS,
    SOL_NATIVE_TOKEN_ADDRESS,
    SOL_ZERO_ADDRESS,
} from '@dimensiondev/web3/constants';
import { rightShift } from '@dimensiondev/web3/numbers';
import { isSameAddress } from '@dimensiondev/web3/utils';
import { toHex } from 'viem';

import type { TokenAsset } from '@/providers/types/Firefly.js';
import type { Token } from '@/providers/types/Transfer.js';

export function formatTokenFromFireflyTokenAsset(token: TokenAsset): Token {
    const chainId = Number(token.chainIndex);
    const decimals = Number(token.decimals);
    const rawAmount = rightShift(token.balance, decimals).toString();

    const id =
        isSameAddress(ETH_NATIVE_TOKEN_ADDRESS, token.tokenAddress) ||
        isSameAddress(SOL_NATIVE_TOKEN_ADDRESS, token.tokenAddress)
            ? chainId === solana.id
                ? SOL_ZERO_ADDRESS
                : ETH_ZERO_ADDRESS
            : token.tokenAddress;

    return {
        amount: Number(token.balance),
        chain: resolveDebankChain(chainId)?.id ?? '',
        decimals,
        display_symbol: token.symbol,
        id,
        is_core: false,
        is_verified: false,
        is_wallet: false,
        logo_url: token.tokenLogoUrl,
        name: token.name,
        optimized_symbol: token.symbol,
        price: token.tokenPrice,
        price_24h_change: 0,
        protocol_id: '',
        raw_amount: rawAmount,
        raw_amount_hex_str: toHex(rawAmount),
        symbol: token.symbol,
        time_at: Date.now(),
        chainId,
        balance: token.balance,
        usdValue: Number(token.tokenPrice) * Number(token.balance) || 0,
        networkType: isValidChainIdEthereum(chainId) ? NetworkType.Ethereum : NetworkType.Solana,
    };
}
