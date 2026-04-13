import { isValidEnumValue } from '@dimensiondev/utils';

import { EthereumChainId } from '@/web3-shared/evm/types.js';
import { SolanaChainId } from '@/web3-shared/solana/types.js';

export function isValidChainIdEthereum(chainId?: EthereumChainId): chainId is EthereumChainId {
    return !!chainId && isValidEnumValue(chainId, EthereumChainId);
}

export function isValidChainIdSolana(chainId?: SolanaChainId): chainId is SolanaChainId {
    return !!chainId && isValidEnumValue(chainId, SolanaChainId);
}
