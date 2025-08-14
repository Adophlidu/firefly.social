import { toHex } from 'viem';

import { NetworkType } from '@/constants/enum.js';
import { isSameAddress } from '@/helpers/isSameAddress.js';
import { isValidChainIdEthereum } from '@/helpers/isValidChainId.js';
import { ETH_ZERO_ADDRESS, SOL_ZERO_ADDRESS } from '@/helpers/isZeroAddress.js';
import { rightShift } from '@/helpers/number.js';
import { resolveDebankChain } from '@/helpers/resolveDebankChain.js';
import { SolanaChainId } from '@/mask_pkgs/web3-shared/solana/index.js';
import type { TokenAsset } from '@/providers/types/Firefly.js';
import type { Token } from '@/providers/types/Transfer.js';

const ETH_NATIVE_ADDRESS = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
const SOLANA_NATIVE_ADDRESS = '11111111111111111111111111111111';

export function formatTokenFromFireflyTokenAsset(token: TokenAsset): Token {
    const chainId = Number(token.chainIndex);
    const decimals = Number(token.decimals);
    const rawAmount = rightShift(token.balance, decimals).toString();

    const id =
        isSameAddress(ETH_NATIVE_ADDRESS, token.tokenAddress) ||
        isSameAddress(SOLANA_NATIVE_ADDRESS, token.tokenAddress)
            ? chainId === SolanaChainId.Mainnet
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
