/* cspell:disable */

import { isValidAddressEthereum } from '@/helpers/isValidAddress.js';
import { memoizePromise } from '@/helpers/memoizePromise.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import { SolanaChainId } from '@/web3-shared/solana/types.js';

export const searchTokenByAddress = memoizePromise(
    async function searchTokenByAddress(address: string) {
        const detected = await FireflyEndpointProvider.detectAddress(address);
        const token = detected?.list.find((x) => x.address_type === 'contract');
        if (!token?.contract_info) return null;

        const contractType = token.contract_type;
        if (contractType !== 'ERC20' && contractType !== 'token') return null;
        if (token.chain === 'solana') {
            token.contract_info.attributes.chain_id = SolanaChainId.Mainnet;
            return { ...token.contract_info, chain_id: SolanaChainId.Mainnet };
        }
        token.contract_info.attributes.chain_id = +token.chain_id;
        return token.contract_info;
    },
    (address) => (isValidAddressEthereum(address) ? address.toLowerCase() : address),
);
