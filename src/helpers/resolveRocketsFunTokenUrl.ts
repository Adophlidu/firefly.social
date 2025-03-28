import type { EthereumChainId } from '@masknet/web3-shared-evm';
import urlcat from 'urlcat';

export function resolveRocketsFunTokenUrl(chainId: EthereumChainId, address: string) {
    return urlcat('https://rockets.fun/token', {
        chain: 'bnb',
        outputCurrency: address,
        inputCurrency: 'bnb',
    });
}
