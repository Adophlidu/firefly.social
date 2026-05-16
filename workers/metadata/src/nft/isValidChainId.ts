import { isValidEnumValue } from '@dimensiondev/workers-shared/helpers/isValidEnumValue.js';
import { EthereumChainId } from '@dimensiondev/workers-shared/types/ethereum.js';
import { SolanaChainId } from '@dimensiondev/workers-shared/types/solana.js';

export function isValidChainIdEthereum(chainId?: EthereumChainId): chainId is EthereumChainId {
    return !!chainId && isValidEnumValue(chainId, EthereumChainId);
}

export function isValidChainIdSolana(chainId?: SolanaChainId): chainId is SolanaChainId {
    return !!chainId && isValidEnumValue(chainId, SolanaChainId);
}
