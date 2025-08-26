import CoinGecko from '@/web3-constants/evm/coingecko.json' with { type: 'json' };
import RPC from '@/web3-constants/evm/rpc.json' with { type: 'json' };
import { transformAll, transformFromJSON } from '@/web3-shared/base/constant.js';
import { EthereumChainId } from '@/web3-shared/evm/types.js';

function getEnvConstants(key: 'WEB3_CONSTANTS_RPC') {
    try {
        const map = {
            WEB3_CONSTANTS_RPC: process.env.WEB3_CONSTANTS_RPC,
        };
        return map[key] || '';
    } catch {
        return '';
    }
}

export const getCoinGeckoConstants = transformAll(EthereumChainId, CoinGecko);

export const getRPCConstant = transformFromJSON(EthereumChainId, getEnvConstants('WEB3_CONSTANTS_RPC'), RPC);
