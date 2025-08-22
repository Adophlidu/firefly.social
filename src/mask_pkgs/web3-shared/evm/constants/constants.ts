import { transformAll, transformFromJSON } from '@/mask_pkgs/web3-shared/base/index.js';
import { EthereumChainId } from '@/mask_pkgs/web3-shared/evm/types/index.js';
import CoinGecko from '#masknet/web3-constants/evm/coingecko.json' with { type: 'json' };
import RPC from '#masknet/web3-constants/evm/rpc.json' with { type: 'json' };

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
