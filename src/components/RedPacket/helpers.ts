import { isValidAddress } from '@masknet/web3-shared-evm';

import { formatAddress } from '@/helpers/formatAddress.js';
import { isValidSolanaAddress } from '@/helpers/isValidSolanaAddress.js';

export function formatSenderName(originSenderName: string) {
    if (isValidAddress(originSenderName) || isValidSolanaAddress(originSenderName)) {
        return formatAddress(originSenderName, 4);
    }
    return `@${(originSenderName as string).replace(/^@/, '')}`;
}
