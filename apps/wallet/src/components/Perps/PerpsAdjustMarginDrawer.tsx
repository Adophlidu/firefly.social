import { Trans } from '@lingui/react/macro';
import BigNumber from 'bignumber.js';

import {
    type AdjustMarginMode,
    getAdjustMarginInputState,
    MIN_ISOLATED_MARGIN_ADJUST_USD,
} from '@/components/Perps/adjustMarginInput.js';
import { toPerpsCoinDisplayName } from '@/components/Perps/perpsCoin.js';
import { TokenIcon } from '@/components/TokenIcon.js';
import { Drawer, DrawerContent, DrawerTitle } from '@/components/ui/drawer.js';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.js';

function formatUsd(value?: string | number | null, maximumFractionDigits = 2) {
    const number = Number(value);
    return Number.isFinite(number) ? `$${number.toLocaleString(undefined, { maximumFractionDigits })}` : '--';
}

interface Props {
    coin: string;
    amount: string;
    mode: AdjustMarginMode;
    markPrice?: string;
    liquidationPrice: string | null;
    currentMargin: string;
    positionValue: string;
    leverage: number;
    withdrawable?: string;
    canRemove: boolean;
    pending: boolean;
    onAmountChange(value: string): void;
    onModeChange(value: AdjustMarginMode): void;
    onClose(): void;
    onConfirm(): void;
}

export function PerpsAdjustMarginDrawer({
    coin,
    amount,
    mode,
    markPrice,
    liquidationPrice,
    currentMargin,
    positionValue,
    leverage,
    withdrawable,
    canRemove,
    pending,
    onAmountChange,
    onModeChange,
    onClose,
    onConfirm,
}: Props) {
    const coinDisplayName = toPerpsCoinDisplayName(coin);
    const state = getAdjustMarginInputState({
        amount,
        mode,
        withdrawable,
        currentMargin,
        positionValue,
        leverage,
        canRemove,
    });
    const availableLabel = mode === 'add' ? <Trans>Available to add</Trans> : <Trans>Available to remove</Trans>;
    const errorLabel =
        state.error === 'below-minimum' ? (
            <Trans>Minimum ${MIN_ISOLATED_MARGIN_ADJUST_USD.toFixed(2)}</Trans>
        ) : state.error === 'exceeds-available' ? (
            <Trans>Amount exceeds the available margin</Trans>
        ) : state.error === 'too-precise' ? (
            <Trans>Enter no more than 2 decimal places</Trans>
        ) : state.error === 'remove-disabled' ? (
            <Trans>Margin cannot be removed from this market</Trans>
        ) : null;

    return (
        <Drawer
            open
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
        >
            <DrawerContent
                className="mx-auto max-w-[400px] rounded-t-[36px] border border-[rgba(34,33,47,0.03)] shadow-[0_16px_20px_rgba(64,61,87,0.1)] outline-none focus:outline-none sm:rounded-t-[36px]"
                bodyClassName="gap-4 overflow-visible px-4 pb-4 pt-2"
            >
                <div className="flex flex-col items-center">
                    <div className="h-1 w-12 rounded-full bg-[#d1d1d1]" />
                    <DrawerTitle className="mt-3 flex-none self-stretch text-left text-xl font-[SF_Pro_Rounded] font-bold leading-6 first:mr-0">
                        {mode === 'add' ? <Trans>Add to Position</Trans> : <Trans>Remove from Position</Trans>}
                    </DrawerTitle>
                </div>

                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <TokenIcon
                            size={30}
                            symbol={coinDisplayName}
                            icon={`https://app.hyperliquid.xyz/coins/${encodeURIComponent(coin)}.svg`}
                        />
                        <span className="text-sm font-semibold leading-[14px]">
                            <Trans>Current Price</Trans>
                        </span>
                    </div>
                    <strong className="text-base font-semibold leading-5">{formatUsd(markPrice, 4)}</strong>
                </div>

                <div className="overflow-hidden rounded-2xl border border-[rgba(34,33,47,0.15)] py-3">
                    <div className="space-y-1 px-3">
                        <div className="flex min-h-10 items-center justify-between gap-2">
                            <span className="shrink-0 text-[13px] font-medium leading-[17px] text-[rgba(70,70,70,0.8)]">
                                <Trans>Amount</Trans>
                            </span>
                            <div className="flex h-10 w-[220px] min-w-0 items-center rounded-lg border border-[rgba(34,33,47,0.15)] px-2 focus-within:border-[#4c4aa9]">
                                <span className="text-sm font-medium">$</span>
                                <input
                                    value={amount}
                                    inputMode="decimal"
                                    aria-label="Margin amount"
                                    className="min-w-0 flex-1 appearance-none border-0 bg-transparent px-1 text-right text-sm font-medium shadow-none outline-none ring-0 focus:border-0 focus:outline-none focus:ring-0"
                                    onChange={(event) => onAmountChange(event.target.value)}
                                />
                                <button
                                    type="button"
                                    disabled={!state.available.gt(0)}
                                    className="px-1.5 text-xs font-semibold text-[#4c4aa9] disabled:opacity-40"
                                    onClick={() =>
                                        onAmountChange(state.available.decimalPlaces(2, BigNumber.ROUND_DOWN).toFixed())
                                    }
                                >
                                    <Trans>MAX</Trans>
                                </button>
                                <Select value={mode} onValueChange={(value) => onModeChange(value as AdjustMarginMode)}>
                                    <SelectTrigger className="h-8 w-[76px] shrink-0 border-0 px-1.5 text-xs font-semibold shadow-none">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="min-w-[96px] bg-white" viewPortClassName="h-auto">
                                        <SelectItem value="add">
                                            <Trans>Add</Trans>
                                        </SelectItem>
                                        <SelectItem value="remove" disabled={!canRemove}>
                                            <Trans>Remove</Trans>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        {errorLabel ? (
                            <p role="alert" className="text-right text-xs text-[#ff372b]">
                                {errorLabel}
                            </p>
                        ) : null}
                        <MarginValueRow label={<Trans>Current Margin</Trans>} value={formatUsd(currentMargin)} />
                        <MarginValueRow label={availableLabel} value={formatUsd(state.available.toFixed())} />
                        <MarginValueRow
                            label={<Trans>Liquidation Price</Trans>}
                            value={formatUsd(liquidationPrice, 4)}
                        />
                    </div>
                    <div className="my-1 border-t border-[rgba(34,33,47,0.15)]" />
                    <div className="px-3">
                        <MarginValueRow
                            label={<Trans>New Total</Trans>}
                            value={state.newTotal ? formatUsd(state.newTotal) : '--'}
                        />
                    </div>
                </div>

                <div className="flex gap-4">
                    <button
                        type="button"
                        className="h-12 flex-1 rounded-full border border-[#171717] text-sm font-bold text-[#171717]"
                        onClick={onClose}
                    >
                        <Trans>Cancel</Trans>
                    </button>
                    <button
                        type="button"
                        disabled={!state.isValid || pending}
                        className="h-12 flex-1 rounded-full bg-[#171717] text-base font-bold text-[#e8e8e8] disabled:opacity-40"
                        onClick={onConfirm}
                    >
                        {pending ? (
                            <Trans>Submitting…</Trans>
                        ) : mode === 'add' ? (
                            <Trans>Add</Trans>
                        ) : (
                            <Trans>Remove</Trans>
                        )}
                    </button>
                </div>
            </DrawerContent>
        </Drawer>
    );
}

function MarginValueRow({ label, value }: { label: React.ReactNode; value: string }) {
    return (
        <div className="flex min-h-10 items-center justify-between gap-4">
            <span className="text-[13px] font-medium leading-[17px] text-[rgba(70,70,70,0.8)]">{label}</span>
            <span className="text-right text-sm font-medium leading-[18px] text-[#171717]">{value}</span>
        </div>
    );
}
