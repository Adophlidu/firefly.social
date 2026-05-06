import { Trans } from '@lingui/react/macro';
import { lazy, Suspense } from 'react';

import {
    DialogOrDrawer,
    DialogOrDrawerContent,
    DialogOrDrawerHeader,
    DialogOrDrawerTitle,
} from '@/components/DialogOrDrawer.js';
import { LoadingPanel } from '@/components/LoadingPanel.js';
import type { TransactionHistoryItem } from '@/providers/types/Firefly.js';

interface Props {
    open: boolean;
    transaction?: TransactionHistoryItem;
    onClose?: () => void;
}

const TransactionDetailContent = lazy(() => import('./TransactionDetailContent.js'));

export function TransactionDetailModal({ open, transaction, onClose }: Props) {
    if (!transaction) return null;

    return (
        <DialogOrDrawer
            open={open}
            onOpenChange={(nextOpen) => {
                if (!nextOpen) {
                    onClose?.();
                }
            }}
        >
            <DialogOrDrawerContent className="md:max-w-[480px]">
                <DialogOrDrawerHeader>
                    <DialogOrDrawerTitle>
                        <Trans>Transaction Detail</Trans>
                    </DialogOrDrawerTitle>
                </DialogOrDrawerHeader>
                <div className="relative min-h-[434px] w-full rounded-xl transition-all md:w-[432px]">
                    <Suspense fallback={<LoadingPanel />}>
                        <TransactionDetailContent transaction={transaction} onClose={onClose} />
                    </Suspense>
                </div>
            </DialogOrDrawerContent>
        </DialogOrDrawer>
    );
}
