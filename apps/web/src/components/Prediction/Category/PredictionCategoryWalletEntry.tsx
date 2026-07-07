'use client';

import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { BigNumber } from 'bignumber.js';
import { memo, type ReactNode, useCallback } from 'react';
import type { Address } from 'viem';

import { STALE_TIMES } from '@/constants/query.js';
import { openLoginModalWithGuard } from '@/controllers/openLoginModal.js';
import { waitForAuthorization } from '@/helpers/waitForPrivyAuthorization.js';
import { useOpenFireflyWallet } from '@/hooks/useOpenFireflyWallet.js';
import { getPolymarketAccount } from '@/providers/firefly/prediction/getPolymarketAccount.js';
import { getPolymarketWalletCash } from '@/providers/firefly/prediction/getPolymarketWalletCash.js';
import { getPolymarketUserValue } from '@/providers/prediction/polymarket/getPolymarketUserValue.js';
import { useFireflyWalletStore } from '@/store/useFireflyWalletStore.js';
import { useFireflyProfileStore } from '@/store/useProfileStore/useFireflyProfileStore.js';

const PREDICT_WALLET_PATH = '/bet';
const PREDICT_DEPOSIT_PATH = '/bet/deposit';

function formatUSD(value?: BigNumber.Value) {
    const amount = BigNumber(value ?? 0);
    if (!amount.isFinite() || amount.isNaN() || amount.isZero()) return '$0';
    if (amount.isLessThan(0.01)) return '<$0.01';
    return `$${amount.toFormat(2)}`;
}

function MetricButton({ label, value, onClick }: { label: ReactNode; value: string; onClick: () => void }) {
    return (
        <button
            type="button"
            className="group flex h-11 min-w-[72px] flex-col items-start justify-center rounded-lg px-2 text-left transition-colors hover:bg-bg"
            onClick={() => {
                onClick();
            }}
        >
            <span className="text-xs font-medium leading-4 text-third transition-colors group-hover:text-second">
                {label}
            </span>
            <span className="text-base font-bold leading-5 text-highlight">{value}</span>
        </button>
    );
}

export const PredictionCategoryWalletEntry = memo(function PredictionCategoryWalletEntry() {
    const currentProfileSession = useFireflyProfileStore.use.currentProfileSession();
    const openFireflyWallet = useOpenFireflyWallet();
    const isLoggedIn = !!currentProfileSession?.profileId;

    const { data: account } = useQuery({
        queryKey: ['getPolymarketAccount', currentProfileSession?.profileId],
        queryFn: () => getPolymarketAccount(),
        enabled: isLoggedIn,
        retry: false,
        retryOnMount: false,
    });

    const proxyAddress = account?.proxyAddress as Address | undefined;
    const { data: cash, isLoading: isCashLoading } = useQuery({
        queryKey: ['polymarket-balance', proxyAddress?.toLowerCase()],
        queryFn: () => getPolymarketWalletCash(proxyAddress as Address),
        enabled: !!proxyAddress,
        staleTime: STALE_TIMES.MINUTE_1,
        retry: false,
    });
    const { data: currentPositionValue, isLoading: isPositionValueLoading } = useQuery({
        queryKey: ['polymarket-user-value', proxyAddress?.toLowerCase()],
        queryFn: () => getPolymarketUserValue(proxyAddress as Address),
        enabled: !!proxyAddress,
        staleTime: STALE_TIMES.MINUTE_1,
        retry: false,
    });

    const openPredictWallet = useCallback(
        async (path: string) => {
            if (!useFireflyProfileStore.getState().currentProfileSession) {
                openLoginModalWithGuard();
                return;
            }

            if (!useFireflyWalletStore.getState().isAuthorized) {
                await waitForAuthorization();
            }

            openFireflyWallet({ path });
        },
        [openFireflyWallet],
    );

    const cashText = isCashLoading ? '$--' : formatUSD(cash);
    const portfolioText =
        isCashLoading || isPositionValueLoading
            ? '$--'
            : formatUSD(BigNumber(cash ?? 0).plus(currentPositionValue ?? 0));

    return (
        <div className="ml-auto flex shrink-0 items-center gap-2">
            {account ? (
                <div className="hidden items-center gap-3 md:flex">
                    <MetricButton
                        label={<Trans>Portfolio</Trans>}
                        value={portfolioText}
                        onClick={() => void openPredictWallet(PREDICT_WALLET_PATH)}
                    />
                    <MetricButton
                        label={<Trans>Cash</Trans>}
                        value={cashText}
                        onClick={() => void openPredictWallet(PREDICT_WALLET_PATH)}
                    />
                </div>
            ) : null}
            <button
                type="button"
                className="flex h-9 items-center justify-center rounded-lg bg-main px-4 text-sm font-bold text-primaryBottom transition-opacity hover:opacity-80"
                onClick={() => void openPredictWallet(PREDICT_DEPOSIT_PATH)}
            >
                <Trans>Deposit</Trans>
            </button>
        </div>
    );
});
