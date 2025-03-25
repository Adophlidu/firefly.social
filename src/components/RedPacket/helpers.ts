import { formatAddress } from '@/helpers/formatAddress.js';
import { isValidEthereumAddress } from '@/helpers/isValidEthereumAddress.js';
import { isValidSolanaAddress } from '@/helpers/isValidSolanaAddress.js';

export function formatSenderName(originSenderName: string) {
    if (isValidEthereumAddress(originSenderName) || isValidSolanaAddress(originSenderName)) {
        return formatAddress(originSenderName, 4);
    }
    return `@${(originSenderName as string).replace(/^@/, '')}`;
}
