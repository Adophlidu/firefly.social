import urlcat from 'urlcat';

import { ENS_ROOT_URL } from '@/constants/index.js';
import { fetchJSON } from '@/helpers/fetchJSON.js';
import type { DomainAPI } from '@/mask_pkgs/web3-providers/types/DomainAPI.js';
import { EthereumChainId } from '@/mask_pkgs/web3-shared/evm/types/index.js';

class R2D2DomainAPI implements DomainAPI.Provider<EthereumChainId> {
    lookup(chainId: EthereumChainId, name: string): Promise<string | undefined> {
        throw new Error('Method not implemented.');
    }

    async reverse(chainId: EthereumChainId, address: string): Promise<string | undefined> {
        const response = await fetchJSON<{ reverseRecord: string; domains: string[] }>(urlcat(ENS_ROOT_URL, address));
        return response?.reverseRecord;
    }
}
export const R2D2Domain = new R2D2DomainAPI();
