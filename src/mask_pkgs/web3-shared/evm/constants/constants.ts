import { getEnumAsArray } from '@masknet/kit';

import {
    transform,
    transformAll,
    transformAllFromJSON,
    transformFromJSON,
} from '@/mask_pkgs/web3-shared/base/index.js';
import { EthereumChainId } from '@/mask_pkgs/web3-shared/evm/types/index.js';
import CoinGecko from '#masknet/web3-constants/evm/coingecko.json' with { type: 'json' };
import ENS from '#masknet/web3-constants/evm/ens.json' with { type: 'json' };
import RedPacket from '#masknet/web3-constants/evm/red-packet.json' with { type: 'json' };
import RPC from '#masknet/web3-constants/evm/rpc.json' with { type: 'json' };
import Token from '#masknet/web3-constants/evm/token.json' with { type: 'json' };

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

export const ChainIdList = getEnumAsArray(EthereumChainId).map((x) => x.value);

export const getCoinGeckoConstants = transformAll(EthereumChainId, CoinGecko);

export const getRedPacketConstant = transform(EthereumChainId, RedPacket);
export const getRedPacketConstants = transformAll(EthereumChainId, RedPacket);

export const getTokenConstant = transform(EthereumChainId, Token);

export const getRPCConstants = transformAllFromJSON(EthereumChainId, getEnvConstants('WEB3_CONSTANTS_RPC'), RPC);
export const getRPCConstant = transformFromJSON(EthereumChainId, getEnvConstants('WEB3_CONSTANTS_RPC'), RPC);

export const getENSConstants = transformAll(EthereumChainId, ENS);
