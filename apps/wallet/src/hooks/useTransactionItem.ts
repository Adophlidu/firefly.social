import { chains, solana } from '@dimensiondev/web3/chains';
import { NetworkType } from '@dimensiondev/web3/enums';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useBlock, useTransaction } from 'wagmi';

import { useCachedWalletAddresses } from '@/hooks/useCachedWalletAddresses.js';
import {
    TransactionHistoryCategory,
    type TransactionHistoryItem,
    TransactionState,
} from '@/providers/types/Firefly.js';
import { getTransactionHistory } from '@/queries/firefly/getTransactionHistory.js';

/**
 * There is no such API endpoint for querying a single transaction history item,
 * so we have to query the transaction and block separately, and then combine
 * them into a transaction history item
 *
 * We also use the transaction history data to check if the transaction exists.
 */
export function useTransactionItem(networkType: NetworkType | null, chainId: number | null, hash: string) {
    const { evmAddress, solanaAddress } = useCachedWalletAddresses();
    const isEvm = networkType === NetworkType.Ethereum;
    const allChains = isEvm ? chains.map((x) => x.id) : [solana.id as number];
    const address = (isEvm ? evmAddress : solanaAddress) ?? undefined;
    const { data: history } = useInfiniteQuery(getTransactionHistory(allChains, address));
    const txFromHistory = history?.pages
        .flatMap((page) => page.list ?? [])
        .find((x) => x.hash === hash && x.chain_id === chainId);

    const _chainId = chainId ?? undefined;
    const hasValidHash = !!hash && hash.startsWith('0x');
    const { data: tx, isLoading } = useTransaction({
        hash: hash as `0x${string}`,
        chainId: _chainId,
        query: { enabled: hasValidHash && !txFromHistory && isEvm },
    });
    const { data: block, isLoading: isLoadingBlock } = useBlock({
        blockNumber: tx?.blockNumber,
        chainId: _chainId,
        query: { enabled: hasValidHash && !txFromHistory && !!tx?.blockNumber },
    });

    const transaction: TransactionHistoryItem | undefined = useMemo(() => {
        if (!tx || !block) return;
        return {
            chain_id: tx.chainId,
            hash: tx.hash,
            block_number: Number(tx.blockNumber),
            from_address: tx.from,
            tx_status: typeof tx.transactionIndex === 'number' ? TransactionState.Success : TransactionState.Failed,
            to_address: tx.to as string,
            timestamp: Number(block.timestamp).toString(),
            // Following fields are dummy data
            project_logo: '',
            project_name: '',
            token_receives: [],
            token_sends: [],
            nft_receives: [],
            nft_sends: [],
            category: TransactionHistoryCategory.ContractInteraction,
        } satisfies TransactionHistoryItem;
    }, [block, tx]);

    if (txFromHistory) {
        return { transaction: txFromHistory, isLoading: false };
    }
    return { transaction, isLoading: isLoading || isLoadingBlock };
}
