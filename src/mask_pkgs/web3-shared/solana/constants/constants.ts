import { transformAll } from '@/mask_pkgs/web3-shared/base/index.js';
import { SolanaChainId } from '@/mask_pkgs/web3-shared/solana/types.js';
import CoinGecko from '#masknet/web3-constants/solana/coingecko.json' with { type: 'json' };

export const getCoinGeckoConstants = transformAll(SolanaChainId, CoinGecko);
