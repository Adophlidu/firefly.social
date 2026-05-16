import { SolanaChainId } from '@dimensiondev/workers-shared/types/solana.js';
import type { Context } from 'hono';

import { detectAddress } from '@/token/src/detectAddress.js';

export async function searchTokenByAddress(address: string, context: Context) {
    const detected = await detectAddress(address, undefined, context);
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
}
