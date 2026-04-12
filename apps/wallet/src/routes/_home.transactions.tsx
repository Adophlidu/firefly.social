import { createFileRoute } from '@tanstack/react-router';
import { lazy, Suspense, useState } from 'react';

import { LoadingPanel } from '@/components/LoadingPanel.js';
import { TransactionDetailModal } from '@/components/TransactionDetailModal/TransactionDetailModal.js';
import TransactionHistory from '@/components/Transactions.js';
import { chains } from '@/configs/chains.js';
import { NetworkType } from '@/constants/enum.js';
import { SolanaChainId } from '@/constants/solana.js';
import { useEmbeddedWalletAddresses } from '@/hooks/useCachedWalletAddresses.js';
import type { TransactionHistoryItem } from '@/providers/types/Firefly.js';

const FireflyWalletChainSelectorWithNetworkType = lazy(() =>
    import('@/components/FireflyWallet/FireflyWalletChainSelectorWithNetworkType.js').then((module) => ({
        default: module.FireflyWalletChainSelectorWithNetworkType,
    })),
);

export const Route = createFileRoute('/_home/transactions')({
    component: TransactionsPage,
    pendingComponent: LoadingPanel,
});

function TransactionsPage() {
    const { evmAddress, solanaAddress } = useEmbeddedWalletAddresses();
    const [networkType, setNetworkType] = useState<NetworkType>(NetworkType.Ethereum);
    const [selectedTransaction, setSelectedTransaction] = useState<TransactionHistoryItem | null>(null);

    const isEvm = networkType === NetworkType.Ethereum;
    const address = isEvm ? evmAddress : solanaAddress;
    const allChains = isEvm ? chains.map((x) => x.id) : [SolanaChainId.Mainnet as number];

    return (
        <div className="w-full px-4">
            <div className="relative z-10 ml-auto mt-[-52px] flex h-11 w-0 items-center justify-end">
                <FireflyWalletChainSelectorWithNetworkType
                    selectedChain={networkType}
                    onSelectChain={setNetworkType}
                    noLabel
                />
            </div>
            {address ? (
                <Suspense fallback={<LoadingPanel />}>
                    <TransactionHistory
                        chains={allChains}
                        address={address}
                        onSelectTransaction={setSelectedTransaction}
                    />
                </Suspense>
            ) : (
                <LoadingPanel />
            )}
            <TransactionDetailModal
                open={!!selectedTransaction}
                transaction={selectedTransaction ?? undefined}
                onClose={() => setSelectedTransaction(null)}
            />
        </div>
    );
}
