import { first } from 'lodash-es';
import urlcat from 'urlcat';

import { CHAINBASE_API_URL } from '@/constants/index.js';
import { fetchCachedJSON } from '@/helpers/fetchJSON.js';
import { formatAddressEthereum } from '@/helpers/formatAddress.js';
import { isSameEthereumAddress } from '@/helpers/isSameAddress.js';
import { isValidAddressEthereum } from '@/helpers/isValidAddress.js';
import { isValidChainIdEthereum } from '@/helpers/isValidChainId.js';
import { isValidDomainEthereum } from '@/helpers/isValidDomain.js';
import type { ENSRecord } from '@/mask_pkgs/web3-providers/Chainbase/types.js';
import type { DomainAPI } from '@/mask_pkgs/web3-providers/types/DomainAPI.js';
import { EthereumChainId } from '@/mask_pkgs/web3-shared/evm/types/index.js';

async function fetchFromChainbase<T>(pathname: string) {
    const data = await fetchCachedJSON<
        | {
              code: 0 | Omit<number, 0>;
              message: 'ok' | Omit<string, 'ok'>;
              data: T;
          }
        | undefined
    >(urlcat(CHAINBASE_API_URL, pathname));
    return data?.code === 0 ? data.data : undefined;
}

const suffixMap: Partial<Record<EthereumChainId, string>> = {
    [EthereumChainId.Mainnet]: 'eth',
    [EthereumChainId.BSC]: 'bnb',
    [EthereumChainId.Arbitrum]: 'arb',
};

class ChainbaseDomainAPI implements DomainAPI.Provider<EthereumChainId> {
    private async getAddress(chainId: EthereumChainId, name: string) {
        if (!isValidChainIdEthereum(chainId)) return;

        const response = await fetchFromChainbase<ENSRecord>(
            urlcat(`/v1/${chainId !== EthereumChainId.BSC ? 'ens' : 'space-id'}/records`, {
                chain_id: chainId,
                domain: name,
            }),
        );
        return response?.address || undefined;
    }

    private async getName(chainId: EthereumChainId, address: string) {
        if (!isValidChainIdEthereum(chainId)) return;

        const response = await fetchFromChainbase<ENSRecord[]>(
            urlcat(`/v1/${chainId !== EthereumChainId.BSC ? 'ens' : 'space-id'}/reverse`, {
                chain_id: chainId,
                address,
            }),
        );

        if (!isSameEthereumAddress(response?.[0]?.address, address)) return;

        const name = first(response)?.name;
        if (!name) return;
        const suffix = suffixMap[chainId] || 'eth';
        return isValidDomainEthereum(name)
            ? name
            : isValidDomainEthereum(`${name}.${suffix}`)
              ? `${name}.${suffix}`
              : undefined;
    }

    async lookup(chainId: EthereumChainId, name: string): Promise<string | undefined> {
        if (!name) return;
        const address = await this.getAddress(chainId, name);
        if (isValidAddressEthereum(address)) return formatAddressEthereum(address);
        return;
    }

    async reverse(chainId: EthereumChainId, address: string): Promise<string | undefined> {
        if (!address || !isValidAddressEthereum(address)) return;
        const name = await this.getName(chainId, address);
        if (isValidDomainEthereum(name)) return name;
        return;
    }
}
export const ChainbaseDomain = new ChainbaseDomainAPI();
