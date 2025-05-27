import { isSameAddress } from '@/helpers/isSameAddress.js';

const ENS_CONTRACT_ADDRESS = '0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85';
const ENS_NAME_WRAPPER_CONTRACT_ADDRESS = '0xD4416b13d2b3a9aBae7AcD5D6C2BbDBE25686401';

export function isENSContractAddress(contract_address: string) {
    return isSameAddress(contract_address, ENS_CONTRACT_ADDRESS);
}

export function isENSNameWrapperContractAddress(contract_address: string) {
    return isSameAddress(contract_address, ENS_NAME_WRAPPER_CONTRACT_ADDRESS);
}
