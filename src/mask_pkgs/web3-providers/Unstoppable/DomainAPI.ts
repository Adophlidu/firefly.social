import urlcat from 'urlcat';

import { fetchJSON } from '@/helpers/fetchJSON.js';
import type { DomainAPI } from '@/mask_pkgs/web3-providers/types/DomainAPI.js';
import type { ResolveDomainResponse } from '@/mask_pkgs/web3-providers/Unstoppable/types.js';
import { EthereumChainId } from '@/mask_pkgs/web3-shared/evm/types/index.js';

const UNSTOPPABLE_HOST = 'https://unstoppable-proxy.r2d2.to';

class UnstoppableAPI implements DomainAPI.Provider<EthereumChainId> {
    public async lookup(chainId: EthereumChainId, handle: string): Promise<string | undefined> {
        const url = urlcat(UNSTOPPABLE_HOST, '/resolve/domains/:handle', {
            handle,
        });
        const res = await fetchJSON<ResolveDomainResponse>(url);
        return res.meta.owner;
    }
    public reverse(chainId: EthereumChainId, address: string): Promise<string | undefined> {
        throw new Error('Unimplemented yet.');
    }
}

export const Unstoppable = new UnstoppableAPI();
