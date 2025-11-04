/* cspell:disable */

import { compact } from 'lodash-es';

import { isValidAddressEthereum } from '@/helpers/isValidAddress.js';
import { memoizePromise } from '@/helpers/memoizePromise.js';
import { fireflyWalletProvider } from '@/providers/firefly/Wallet.js';
import { SolanaChainId } from '@/web3-shared/solana/types.js';

export const searchTokensByAddress = memoizePromise(
    async function searchTokensByAddress(address: string) {
        const detected = await fireflyWalletProvider.detectAddress(address);
        if (!detected) return [];
        return compact(
            detected.list.map((x) => {
                if (x.address_type !== 'contract') return null;

                if (!x?.contract_info) return null;

                const contractType = x?.contract_type;
                if (contractType !== 'ERC20' && contractType !== 'token') return null;

                if (x.chain === 'solana') {
                    x.contract_info.attributes.chain_id = SolanaChainId.Mainnet;
                    return { ...x.contract_info, chain_id: SolanaChainId.Mainnet };
                }
                x.contract_info.attributes.chain_id = +x.chain_id;
                return x.contract_info;
            }),
        );
    },
    (address) => (isValidAddressEthereum(address) ? address.toLowerCase() : address),
);
