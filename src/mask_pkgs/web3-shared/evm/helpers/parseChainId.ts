import { isValidChainId } from '@/mask_pkgs/web3-shared/evm/helpers/isValidChainId.js';
import type { ChainId } from '@/mask_pkgs/web3-shared/evm/types/index.js';

export function parseChainId(chainId: number | string | undefined): ChainId | undefined {
    if (typeof chainId === 'string') return parseChainId(Number.parseInt(chainId, 16));
    if (typeof chainId === 'number' && isValidChainId(chainId)) return chainId as ChainId;
    return;
}
