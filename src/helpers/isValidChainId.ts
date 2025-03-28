import { getEnumAsArray } from '@masknet/kit';

import { EthereumChainId } from '@/mask_pkgs/web3-shared/evm/index.js';
import { SolanaChainId } from '@/mask_pkgs/web3-shared/solana/index.js';

export function isValidChainIdEthereum(chainId?: EthereumChainId): chainId is EthereumChainId {
    return getEnumAsArray(EthereumChainId).some((x) => x.value === chainId);
}

export function isValidChainIdSolana(chainId?: SolanaChainId): chainId is SolanaChainId {
    return getEnumAsArray(SolanaChainId).some((x) => x.value === chainId);
}
