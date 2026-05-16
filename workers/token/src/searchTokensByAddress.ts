import { compact } from '@dimensiondev/workers-shared/helpers/compact.js';
import { SolanaChainId } from '@dimensiondev/workers-shared/types/solana.js';
import type { Context } from 'hono';

import { detectAddress } from '@/token/src/detectAddress.js';

export async function searchTokensByAddress(address: string, c: Context) {
    const detected = await detectAddress(address, undefined, c);
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
}
