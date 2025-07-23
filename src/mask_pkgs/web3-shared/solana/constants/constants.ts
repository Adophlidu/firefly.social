import { transform, transformAll, transformAllHook, transformHook } from '@/mask_pkgs/web3-shared/base/index.js';
import { SolanaChainId } from '@/mask_pkgs/web3-shared/solana/types.js';
import CoinGecko from '#masknet/web3-constants/solana/coingecko.json' with { type: 'json' };

export const getCoinGeckoConstant = transform(SolanaChainId, CoinGecko);
export const getCoinGeckoConstants = transformAll(SolanaChainId, CoinGecko);
export const useCoinGeckoConstants = transformAllHook(getCoinGeckoConstants);
export const useCoinGeckoConstant = transformHook(getCoinGeckoConstants);
