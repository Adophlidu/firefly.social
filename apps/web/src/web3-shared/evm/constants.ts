import CoinGecko from '@/web3-constants/evm/coingecko.json' with { type: 'json' };
import { transformAll } from '@/web3-shared/base/constant.js';
import { EthereumChainId } from '@/web3-shared/evm/types.js';

export const getCoinGeckoConstants = transformAll(EthereumChainId, CoinGecko);
