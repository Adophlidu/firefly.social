import { Trans } from '@lingui/react/macro';
import type { JSX } from 'react';

import { UnreachableError } from '@/constants/error.js';
import { createLookupTableResolver } from '@/helpers/createLookupTableResolver.js';
import { TransactionHistoryCategory } from '@/providers/types/Firefly.js';

export const resolveTransactionCategoryTitle = createLookupTableResolver<TransactionHistoryCategory, JSX.Element>(
    {
        [TransactionHistoryCategory.TokenReceive]: <Trans>Received</Trans>,
        [TransactionHistoryCategory.TokenSend]: <Trans>Sent</Trans>,
        [TransactionHistoryCategory.TokenApprove]: <Trans>Approved</Trans>,
        [TransactionHistoryCategory.TokenRevoke]: <Trans>Revoked</Trans>,
        [TransactionHistoryCategory.ContractInteraction]: <Trans>Interacted</Trans>,
        [TransactionHistoryCategory.NftReceive]: <Trans>NFT Received</Trans>,
        [TransactionHistoryCategory.NftSend]: <Trans>NFT Sent</Trans>,
        [TransactionHistoryCategory.NftMint]: <Trans>NFT Mint</Trans>,
        [TransactionHistoryCategory.TokenSwap]: <Trans>Swapped</Trans>,
    },
    (category) => {
        throw new UnreachableError('category', category);
    },
);

export const resolveTransactionCategoryPreWord = createLookupTableResolver<TransactionHistoryCategory, JSX.Element>(
    {
        [TransactionHistoryCategory.TokenReceive]: <Trans>From</Trans>,
        [TransactionHistoryCategory.TokenSend]: <Trans>to</Trans>,
        [TransactionHistoryCategory.TokenSwap]: <Trans>with</Trans>,
        [TransactionHistoryCategory.TokenApprove]: <Trans>on</Trans>,
        [TransactionHistoryCategory.TokenRevoke]: <Trans>on</Trans>,
        [TransactionHistoryCategory.ContractInteraction]: <Trans>with</Trans>,
        [TransactionHistoryCategory.NftReceive]: <Trans>From</Trans>,
        [TransactionHistoryCategory.NftSend]: <Trans>to</Trans>,
        [TransactionHistoryCategory.NftMint]: <Trans>on</Trans>,
    },
    (category) => {
        throw new UnreachableError('category', category);
    },
);
