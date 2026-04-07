import { EthereumChainId } from '@/constants/ethereum.js';
import { SolanaChainId } from '@/constants/solana.js';
import { isValidEnumValue } from '@/helpers/isValidEnumValue.js';

export function isValidChainIdEthereum(chainId?: EthereumChainId): chainId is EthereumChainId {
    return !!chainId && isValidEnumValue(chainId, EthereumChainId);
}

export function isValidChainIdSolana(chainId?: SolanaChainId): chainId is SolanaChainId {
    return !!chainId && isValidEnumValue(chainId, SolanaChainId);
}
