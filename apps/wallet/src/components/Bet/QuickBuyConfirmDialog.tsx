import LightningIcon from '@dimensiondev/assets/lightning.svg';
import { formatTokenItemAmount } from '@dimensiondev/web3/utils';
import { Trans } from '@lingui/react/macro';
import { useMemo } from 'react';

import { DialogOrDrawer, DialogOrDrawerContent, DialogOrDrawerFooter } from '@/components/DialogOrDrawer.js';
import { Button } from '@/components/ui/button.js';
import { formatTokenUSDConditional } from '@/helpers/formatTokenUSDConditional.js';
import { captureWalletTelemetryEvent, WalletTelemetryEventId } from '@/helpers/swap/swapAnalytics.js';
import { pusdTokenFallback } from '@/hooks/bet/useTokenDetail.js';
import { cn } from '@/lib/utils.js';

export interface QuickBuyConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    outcome: string;
    predictWalletPayUsd: BigNumber | string | number;
    fireflyWalletPayUsd: BigNumber | string | number;
    fireflyWalletAvailableUsd: BigNumber | string | number;
    totalUsd: BigNumber | string | number;
    confirmDisabled?: boolean;
    confirming?: boolean;
    onConfirm: () => Promise<unknown> | void;
    telemetryContext?: {
        event_slug: string;
        event_title: string;
        market_slug: string;
        market_title: string;
        market_group_item_name?: string;
        market_outcome: string;
        proxy_wallet_address: string;
        order_type: string;
        shares: string;
        avg_price: string;
    };
}

export function QuickBuyConfirmDialog({
    open,
    onOpenChange,
    outcome,
    predictWalletPayUsd,
    fireflyWalletPayUsd,
    fireflyWalletAvailableUsd,
    totalUsd,
    confirmDisabled,
    confirming,
    onConfirm,
    telemetryContext,
}: QuickBuyConfirmDialogProps) {
    const predictPayText = useMemo(() => formatTokenUSDConditional(predictWalletPayUsd), [predictWalletPayUsd]);
    const fireflyPayText = useMemo(() => formatTokenUSDConditional(fireflyWalletPayUsd), [fireflyWalletPayUsd]);
    const totalText = useMemo(() => formatTokenUSDConditional(totalUsd), [totalUsd]);
    const availableText = useMemo(() => formatTokenItemAmount(fireflyWalletAvailableUsd), [fireflyWalletAvailableUsd]);

    return (
        <DialogOrDrawer open={open} onOpenChange={onOpenChange}>
            <DialogOrDrawerContent className="p-0">
                <div className="w-full space-y-6 pt-6">
                    <div className="flex w-full items-center justify-between">
                        <div className="flex items-center gap-2">
                            <LightningIcon width={24} height={24} className="shrink-0" />
                            <div className="text-xl font-semibold leading-6 text-main">
                                <Trans>Quick Buy</Trans>
                            </div>
                        </div>
                    </div>

                    <div className="w-full text-base font-medium leading-5 text-main">
                        <Trans>Low on balance? Your Firefly Wallet can automatically cover the rest.</Trans>
                    </div>

                    <div className="border-line-2 w-full rounded-2xl border py-3">
                        <div className="w-full space-y-4 px-3">
                            <div className="flex w-full items-center justify-between gap-3">
                                <div className="text-[13px] leading-6 text-second">
                                    <Trans>Predict Wallet Pay</Trans>
                                </div>
                                <div className="text-base font-semibold leading-5 text-main">{predictPayText}</div>
                            </div>

                            <div className="flex w-full items-center justify-between gap-3">
                                <div className="text-[13px] leading-6 text-second">
                                    <Trans>Firefly Wallet Pay</Trans>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <div className="text-base font-semibold leading-5 text-highlight">
                                        {fireflyPayText}
                                    </div>
                                    <div className="text-xs font-medium leading-3 text-second">
                                        <Trans>
                                            Available: {availableText} {pusdTokenFallback.symbol}
                                        </Trans>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="border-b-line-2 my-3 h-0 w-full border-b" />

                        <div className="flex w-full items-center justify-between gap-3 px-3">
                            <div className="text-[13px] leading-6 text-second">
                                <Trans>Amount</Trans>
                            </div>
                            <div className="text-base font-semibold leading-5 text-main">{totalText}</div>
                        </div>
                    </div>

                    <DialogOrDrawerFooter className={cn('grid w-full grid-cols-2 gap-4 pt-0', 'mt-0')}>
                        <Button
                            type="button"
                            variant="outline"
                            size="lg"
                            className="h-12 w-full rounded-full"
                            disabled={Boolean(confirming)}
                            onClick={() => onOpenChange(false)}
                        >
                            <Trans>Back</Trans>
                        </Button>
                        <Button
                            type="button"
                            variant="primary"
                            size="lg"
                            className="h-12 w-full rounded-full"
                            disabled={Boolean(confirmDisabled) || Boolean(confirming)}
                            loading={confirming}
                            onClick={() => {
                                captureWalletTelemetryEvent(
                                    WalletTelemetryEventId.BETS_MARKET_QUICK_BUY_CONFIRM_CLICK,
                                    {
                                        ...(telemetryContext || {}),
                                        bets_pay_value: String(predictWalletPayUsd),
                                        wallet_pay_value: String(fireflyWalletPayUsd),
                                        amount_usd: String(totalUsd),
                                    },
                                );
                                onConfirm();
                            }}
                        >
                            <span className="flex min-w-0 items-center justify-center gap-1">
                                <span className="shrink-0">
                                    <Trans>Buy</Trans>
                                </span>
                                <span className="min-w-0 truncate">{outcome}</span>
                            </span>
                        </Button>
                    </DialogOrDrawerFooter>
                </div>
            </DialogOrDrawerContent>
        </DialogOrDrawer>
    );
}
