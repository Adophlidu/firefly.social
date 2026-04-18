import { solana } from '@dimensiondev/web3/chains';

import CoinGecko from '@/web3-constants/solana/coingecko.json' with { type: 'json' };
import { transformAll } from '@/web3-shared/base/constant.js';
import type { ChainIdEnum } from '@/web3-shared/base/types.js';

const solanaChainIdEnum: ChainIdEnum<typeof solana.id> = {
    [solana.id]: 'Mainnet',
    Mainnet: solana.id,
};

export const getCoinGeckoConstants = transformAll(solanaChainIdEnum, CoinGecko);
