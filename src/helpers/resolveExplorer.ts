import { isValidChainIdEthereum, isValidChainIdSolana } from '@/helpers/isValidChainId.js';
import { EVMExplorerResolver, SolanaExplorerResolver } from '@/mask/index.js';

export function resolveAddressLink(chainId: number, address: string) {
    if (isValidChainIdEthereum(chainId)) return EVMExplorerResolver.addressLink(chainId, address);
    if (isValidChainIdSolana(chainId)) return SolanaExplorerResolver.addressLink(chainId, address);
    return '';
}
