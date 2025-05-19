import { isValidEnumValue } from '@/helpers/isValidEnumValue.js';
import { EthereumChainId } from '@/mask_pkgs/web3-shared/evm/index.js';
import { SolanaChainId } from '@/mask_pkgs/web3-shared/solana/index.js';

export function isValidChainIdEthereum(chainId?: EthereumChainId): chainId is EthereumChainId {
    return !!chainId && isValidEnumValue(chainId, EthereumChainId);
}

export function isValidChainIdSolana(chainId?: SolanaChainId): chainId is SolanaChainId {
    return !!chainId && isValidEnumValue(chainId, SolanaChainId);
}
