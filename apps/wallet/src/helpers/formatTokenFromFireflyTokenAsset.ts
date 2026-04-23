import { isValidChainIdEthereum, resolveDebankChain, solana } from '@dimensiondev/web3/chains';
import { ETH_ZERO_ADDRESS, SOL_ZERO_ADDRESS } from '@dimensiondev/web3/constants';
import { NetworkType } from '@dimensiondev/web3/enums';
import { rightShift } from '@dimensiondev/web3/numbers';
import { isNativeTokenAddress } from '@dimensiondev/web3/utils';
import { toHex } from 'viem';

import type { TokenAsset } from '@/providers/types/Firefly.js';
import type { Token } from '@/providers/types/Transfer.js';

export function formatTokenFromFireflyTokenAsset(token: TokenAsset): Token {
    const chainId = Number(token.chainIndex);
    const decimals = Number(token.decimals);
    const rawAmount = rightShift(token.balance, decimals).toString();

    const id = isNativeTokenAddress(token.tokenAddress)
        ? chainId === solana.id
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
