import { toHex } from 'viem';

import { NetworkType } from '@/constants/enum.js';
import { SolanaChainId } from '@/constants/solana.js';
import { isSameAddress } from '@/helpers/isSameAddress.js';
import { isValidChainIdEthereum } from '@/helpers/isValidChainId.js';
import { ETH_ZERO_ADDRESS, SOL_ZERO_ADDRESS } from '@/helpers/isZeroAddress.js';
import { rightShift } from '@/helpers/number.js';
import { resolveDebankChain } from '@/helpers/resolveDebankChain.js';
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
        displaySymbol: token.symbol,
        id,
        isCore: false,
        isVerified: false,
        isWallet: false,
        logoUrl: token.tokenLogoUrl,
        name: token.name,
        optimizedSymbol: token.symbol,
        price: token.tokenPrice,
        price24hChange: 0,
        protocolId: '',
        rawAmount,
        rawAmountHexStr: toHex(rawAmount),
        symbol: token.symbol,
        timeAt: Date.now(),
        chainId,
        balance: token.balance,
        usdValue: Number(token.tokenPrice) * Number(token.balance) || 0,
        networkType: isValidChainIdEthereum(chainId) ? NetworkType.Ethereum : NetworkType.Solana,
    };
}
