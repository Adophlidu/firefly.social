import { Protocol } from '@/constants/farcaster.js';
import { isValidAddressEthereum, isValidAddressSolana } from '@/helpers/isValidAddress.js';

export function determineFarcasterProtocol(address: string): Protocol {
    if (isValidAddressEthereum(address)) return Protocol.ETHEREUM;
    if (isValidAddressSolana(address)) return Protocol.SOLANA;
    throw new Error(`Invalid address format: "${address}" is not a valid Ethereum or Solana address`);
}
