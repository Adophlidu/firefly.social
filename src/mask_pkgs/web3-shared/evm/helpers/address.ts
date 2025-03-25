import { memoize } from 'lodash-es';
import * as web3_utils from /* webpackDefer: true */ 'web3-utils';

import { isSameAddress } from '@/helpers/isSameAddress.js';
import {
    ChainIdList,
    getENSConstants,
    getTokenConstant,
    ZERO_ADDRESS,
} from '@/mask_pkgs/web3-shared/evm/constants/index.js';

export function checksumAddress(address: string) {
    return web3_utils.toChecksumAddress(address);
}

export function isEmptyHex(hex?: string): hex is undefined {
    return !hex || ['0x', '0x0'].includes(hex);
}

export const isValidAddress: (address?: string) => address is string = memoize(function isValidAddress(
    address?: string,
): address is string {
    if (!address) return false;
    return web3_utils.isAddress(address);
});

export function isZeroAddress(address?: string): address is '0x0000000000000000000000000000000000000000' {
    return isSameAddress(address, ZERO_ADDRESS);
}

const nativeTokenSet = new Set(ChainIdList.map((chainId) => getTokenConstant(chainId, 'NATIVE_TOKEN_ADDRESS')));

export function isNativeTokenAddress(address?: string): address is string {
    return !!(address && nativeTokenSet.has(address));
}

const { ENS_CONTRACT_ADDRESS } = getENSConstants();
export function isENSContractAddress(contract_address: string) {
    return isSameAddress(contract_address, ENS_CONTRACT_ADDRESS);
}

const { ENS_NAME_WRAPPER_CONTRACT_ADDRESS } = getENSConstants();
export function isENSNameWrapperContractAddress(contract_address: string) {
    return isSameAddress(contract_address, ENS_NAME_WRAPPER_CONTRACT_ADDRESS);
}
