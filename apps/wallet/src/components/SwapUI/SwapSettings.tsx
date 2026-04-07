import { Trans } from '@lingui/react/macro';
import { useAtomValue, useSetAtom } from 'jotai';
import { memo, useCallback, useState } from 'react';

import {
    DialogOrDrawer,
    DialogOrDrawerContent,
    DialogOrDrawerHeader,
    DialogOrDrawerTitle,
} from '@/components/DialogOrDrawer.js';
import { Input } from '@/components/ui/input.js';
import { Switch } from '@/components/ui/switch.js';
import { setSkipReviewAtom, setSlippageAtom, skipReviewAtom, slippageAtom } from '@/store/swap/swapSettings.js';

export interface SwapSettingsProps {
    trigger: React.ReactNode;
}

export const SwapSettings = memo(function SwapSettings({ trigger }: SwapSettingsProps) {
    const [open, setOpen] = useState(false);
    const slippage = useAtomValue(slippageAtom);
    const skipReview = useAtomValue(skipReviewAtom);
    const setSlippage = useSetAtom(setSlippageAtom);
    const setSkipReview = useSetAtom(setSkipReviewAtom);
    const [customSlippage, setCustomSlippage] = useState<string>(() => (slippage !== 'auto' ? String(slippage) : ''));

    const isAuto = slippage === 'auto';

    const handleAutoToggle = useCallback(
        (checked: boolean) => {
            if (!checked) {
                // Turning auto off - use custom value or default 1
                const num = parseFloat(customSlippage);
                if (!isNaN(num) && num >= 0.5 && num <= 100) {
                    setSlippage(num);
                } else {
                    setCustomSlippage('1');
                    setSlippage(1);
                }
            } else {
                setSlippage('auto');
            }
        },
        [customSlippage, setSlippage],
    );

    const handleCustomChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value;

            // Allow empty input for deletion
            if (value === '') {
                setCustomSlippage(value);
                return;
            }

            const num = parseFloat(value);
            if (!isNaN(num)) {
                // Only clamp clearly out-of-range values during input
                // Values between 0 and 0.5 are allowed (user might be typing 0.5)
                let clampedValue = value;
                if (num > 100) {
                    clampedValue = '100';
                } else if (num < 0) {
                    clampedValue = '0.5';
                }

                setCustomSlippage(clampedValue);

                const clampedNum = parseFloat(clampedValue);
                if (clampedNum >= 0.5 && clampedNum <= 100) {
                    setSlippage(clampedNum);
                }
            } else {
                setCustomSlippage(value);
            }
        },
        [setSlippage],
    );

    const handleCustomBlur = useCallback(() => {
        let num = parseFloat(customSlippage);

        // Handle invalid/empty values
        if (isNaN(num) || customSlippage === '') {
            setCustomSlippage('0.5');
            setSlippage(0.5);
            return;
        }

        // Truncate to 2 decimal places
        num = Math.round(num * 100) / 100;

        // Clamp to valid range
        if (num < 0.5) {
            num = 0.5;
        } else if (num > 100) {
            num = 100;
        }

        setCustomSlippage(num.toString());
        setSlippage(num);
    }, [customSlippage, setSlippage]);

    return (
        <>
            <div onClick={() => setOpen(true)}>{trigger}</div>

            <DialogOrDrawer open={open} onOpenChange={setOpen}>
                <DialogOrDrawerContent className="max-h-screen">
                    <DialogOrDrawerHeader className="shrink-0 !flex-row">
                        <DialogOrDrawerTitle className="flex justify-start">
                            <Trans>Current settings</Trans>
                        </DialogOrDrawerTitle>
                    </DialogOrDrawerHeader>

                    <div className="flex flex-col gap-6">
                        <div className="flex flex-col gap-1">
                            <label className="text-base font-semibold">
                                <Trans>Slippage</Trans>
                            </label>
                            <span className="text-secondary text-sm">
                                <Trans>We will find the lowest slippage for a successful swap</Trans>
                            </span>

                            <div className="bg-lightBg mt-1 flex flex-col gap-3 rounded-2xl p-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-base font-semibold">
                                        <Trans>Auto</Trans>
                                    </span>
                                    <Switch checked={isAuto} onCheckedChange={handleAutoToggle} />
                                </div>

                                {!isAuto ? (
                                    <div className="border-secondaryLine dark:bg-bg02 box-border flex flex-col rounded-lg border bg-white px-3 py-1">
                                        <span className="text-secondary inline-block h-4 shrink-0 text-xs leading-4">
                                            <Trans>Custom (0.5-100%)</Trans>
                                        </span>
                                        <div className="flex shrink-0 items-center">
                                            <Input
                                                type="number"
                                                value={customSlippage}
                                                onChange={handleCustomChange}
                                                onBlur={handleCustomBlur}
                                                className="h-6 flex-1 border-0 bg-transparent p-0 text-base leading-6 shadow-none focus-visible:ring-0"
                                                min={0.5}
                                                max={100}
                                                step={0.1}
                                                inputMode="decimal"
                                                formNoValidate
                                            />
                                            <span className="text-main">%</span>
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-base font-semibold">
                                <Trans>Skip reviews</Trans>
                            </label>
                            <span className="text-secondary text-sm">
                                <Trans>Swap faster by skipping the review step</Trans>
                            </span>

                            <div className="bg-lightBg mt-1 flex items-center justify-between rounded-2xl px-3 py-4">
                                <span className="text-base font-semibold">
                                    <Trans>Enable skip reviews</Trans>
                                </span>
                                <Switch checked={skipReview} onCheckedChange={setSkipReview} />
                            </div>
                        </div>

                        <button
                            type="button"
                            className="bg-main h-10 w-full rounded-full text-[15px] font-bold text-white dark:text-black"
                            onClick={() => setOpen(false)}
                        >
                            <Trans>Confirm</Trans>
                        </button>
                    </div>
                </DialogOrDrawerContent>
            </DialogOrDrawer>
        </>
    );
});
