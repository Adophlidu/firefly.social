import { isValidEnumValue } from '@dimensiondev/utils';

import { ETHEREUM_CHAIN_IDS } from '@/web3-shared/evm/types.js';
import { SolanaChainId } from '@/web3-shared/solana/types.js';

export function isValidChainIdEthereum(chainId: number | undefined) {
    return typeof chainId === 'number' && ETHEREUM_CHAIN_IDS.some((id) => id === chainId);
}

export function isValidChainIdSolana(chainId: SolanaChainId | undefined) {
    return typeof chainId === 'number' && isValidEnumValue(chainId, SolanaChainId);
}
