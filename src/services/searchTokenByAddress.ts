/* cspell:disable */

import { memoizePromise } from '@/helpers/memoizePromise.js';
import { SolanaChainId } from '@/mask_pkgs/web3-shared/solana/types.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';

export const searchTokenByAddress = memoizePromise(
    async function searchTokenByAddress(address: string) {
        const detected = await FireflyEndpointProvider.detectAddress(address);
        const token = detected?.list.find((x) => x.address_type === 'contract');
        if (!token) return null;

        const contractType = token?.contract_type;
        if (contractType !== 'ERC20' && contractType !== 'token') return null;
        if (token?.chain === 'solana') {
            token.contract_info.attributes.chain_id = SolanaChainId.Mainnet;
            return token.contract_info;
        }
        return token.contract_info;
    },
    (address) => address,
);
