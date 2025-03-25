import { ChainIdList } from '@/mask_pkgs/web3-shared/evm/constants/constants.js';
import { type ChainId } from '@/mask_pkgs/web3-shared/evm/types/index.js';

export function isValidChainId(chainId?: ChainId): chainId is ChainId {
    // TODO custom networks
    return ChainIdList.some((x) => x === chainId);
}
