import { transform, transformAll, transformAllHook, transformHook } from '@/mask_pkgs/web3-shared/base/index.js';
import { SolanaChainId } from '@/mask_pkgs/web3-shared/solana/types.js';
import CoinGecko from '#masknet/web3-constants/solana/coingecko.json' with { type: 'json' };
import Token from '#masknet/web3-constants/solana/token.json' with { type: 'json' };
import TokenList from '#masknet/web3-constants/solana/token-list.json' with { type: 'json' };

export const getTokenConstant = transform(SolanaChainId, Token);
export const getTokenConstants = transformAll(SolanaChainId, Token);
export const useTokenConstants = transformAllHook(getTokenConstants);
export const useTokenConstant = transformHook(getTokenConstants);

export const getTokenListConstant = transform(SolanaChainId, TokenList);
export const getTokenListConstants = transformAll(SolanaChainId, TokenList);

export const getCoinGeckoConstant = transform(SolanaChainId, CoinGecko);
export const getCoinGeckoConstants = transformAll(SolanaChainId, CoinGecko);
export const useCoinGeckoConstants = transformAllHook(getCoinGeckoConstants);
export const useCoinGeckoConstant = transformHook(getCoinGeckoConstants);
