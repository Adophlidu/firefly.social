import { EthereumChainId, ProviderType } from '@/mask_pkgs/web3-shared/evm/types/index.js';

export function getDefaultChainId() {
    return EthereumChainId.Mainnet;
}

export function getDefaultProviderType() {
    return ProviderType.None;
}
