import { isValidChainIdEthereum, isValidChainIdSolana } from '@dimensiondev/web3/chains';
import { EthExplorerResolver, SolanaExplorerResolver } from '@dimensiondev/web3/resolvers';

export function resolveAddressLink(chainId: number, address: string) {
    if (isValidChainIdEthereum(chainId)) return EthExplorerResolver.addressLink(chainId, address);
    if (isValidChainIdSolana(chainId)) return SolanaExplorerResolver.addressLink(chainId, address);
    return '';
}
