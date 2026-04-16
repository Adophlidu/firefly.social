import { formatAddress, isValidAddressEthereum, isValidAddressSolana } from '@dimensiondev/web3/utils';

export function formatSenderName(originSenderName: string) {
    if (isValidAddressEthereum(originSenderName) || isValidAddressSolana(originSenderName)) {
        return formatAddress(originSenderName, 4);
    }
    return `@${(originSenderName as string).replace(/^@/, '')}`;
}
