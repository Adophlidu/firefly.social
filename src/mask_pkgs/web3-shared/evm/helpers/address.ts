import { isSameAddress } from '@/helpers/isSameAddress.js';
import { getENSConstants } from '@/mask_pkgs/web3-shared/evm/constants/constants.js';

export function isEmptyHex(hex?: string): hex is undefined {
    return !hex || ['0x', '0x0'].includes(hex);
}

const { ENS_CONTRACT_ADDRESS, ENS_NAME_WRAPPER_CONTRACT_ADDRESS } = getENSConstants();
export function isENSContractAddress(contract_address: string) {
    return isSameAddress(contract_address, ENS_CONTRACT_ADDRESS);
}

export function isENSNameWrapperContractAddress(contract_address: string) {
    return isSameAddress(contract_address, ENS_NAME_WRAPPER_CONTRACT_ADDRESS);
}
