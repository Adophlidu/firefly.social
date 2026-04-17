import { ETH_ZERO_ADDRESS, SOL_ZERO_ADDRESS } from '@dimensiondev/web3/constants';
import { isNativeTokenAddress } from '@dimensiondev/web3/utils';
import { toHex } from 'viem';

import { NetworkType } from '@/constants/enum.js';
import { SolanaChainId } from '@/constants/solana.js';
import { isValidChainIdEthereum } from '@/helpers/isValidChainId.js';
import { rightShift } from '@/helpers/number.js';
import { resolveDebankChain } from '@/helpers/resolveDebankChain.js';
import type { TokenAsset } from '@/providers/types/Firefly.js';
import type { Token } from '@/providers/types/Transfer.js';

export function formatTokenFromFireflyTokenAsset(token: TokenAsset): Token {
    const chainId = Number(token.chainIndex);
    const decimals = Number(token.decimals);
    const rawAmount = rightShift(token.balance, decimals).toString();

    const id = isNativeTokenAddress(token.tokenAddress)
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
