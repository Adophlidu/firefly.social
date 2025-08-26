import { isValidChainIdEthereum, isValidChainIdSolana } from '@/helpers/isValidChainId.js';
import { EVMExplorerResolver } from '@/web3-providers/Web3/EVM/apis/ResolverAPI.js';
import { SolanaExplorerResolver } from '@/web3-providers/Web3/Solana/apis/ResolverAPI.js';

export function resolveAddressLink(chainId: number, address: string) {
    if (isValidChainIdEthereum(chainId)) return EVMExplorerResolver.addressLink(chainId, address);
    if (isValidChainIdSolana(chainId)) return SolanaExplorerResolver.addressLink(chainId, address);
    return '';
}
