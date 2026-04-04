import { formatAddress } from '@/helpers/formatAddress.js';
import { isValidAddressEthereum, isValidAddressSolana } from '@/helpers/isValidAddress.js';

export function formatSenderName(originSenderName: string) {
    if (isValidAddressEthereum(originSenderName) || isValidAddressSolana(originSenderName)) {
        return formatAddress(originSenderName, 4);
    }
    return `@${(originSenderName as string).replace(/^@/, '')}`;
}
