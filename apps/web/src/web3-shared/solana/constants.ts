import CoinGecko from '@/web3-constants/solana/coingecko.json' with { type: 'json' };
import { transformAll } from '@/web3-shared/base/constant.js';
import { SolanaChainId } from '@/web3-shared/solana/types.js';

export const getCoinGeckoConstants = transformAll(SolanaChainId, CoinGecko);
