import CoinGecko from '@masknet/web3-constants/evm/coingecko.json' with { type: 'json' };
import ENS from '@masknet/web3-constants/evm/ens.json' with { type: 'json' };
import RedPacket from '@masknet/web3-constants/evm/red-packet.json' with { type: 'json' };
import RPC from '@masknet/web3-constants/evm/rpc.json' with { type: 'json' };
import Token from '@masknet/web3-constants/evm/token.json' with { type: 'json' };

import { getEnumAsArray } from '@masknet/kit';
import { transform, transformAll, transformAllFromJSON, transformFromJSON } from '@masknet/web3-shared-base';
import { ChainId } from '../types/index.js';

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

export const ChainIdList = getEnumAsArray(ChainId).map((x) => x.value);

export const getCoinGeckoConstants = transformAll(ChainId, CoinGecko);

export const getRedPacketConstant = transform(ChainId, RedPacket);
export const getRedPacketConstants = transformAll(ChainId, RedPacket);

export const getTokenConstant = transform(ChainId, Token);

export const getRPCConstants = transformAllFromJSON(ChainId, getEnvConstants('WEB3_CONSTANTS_RPC'), RPC);
export const getRPCConstant = transformFromJSON(ChainId, getEnvConstants('WEB3_CONSTANTS_RPC'), RPC);

export const getENSConstants = transformAll(ChainId, ENS);
