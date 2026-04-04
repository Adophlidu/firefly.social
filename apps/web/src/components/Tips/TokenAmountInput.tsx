import { classNames } from '@dimensiondev/utils';
import { t } from '@lingui/core/macro';
import { memo, useCallback } from 'react';

import { ClickableButton } from '@/components/ClickableButton.js';
import { NUMERIC_INPUT_REGEXP_PATTERN } from '@/constants/regexp.js';
import { useIsMedium } from '@/hooks/useMediaQuery.js';
import { useTipsStore } from '@/store/useTipsStore.js';

const usdtValueConfigs = [{ usdt: 1 }, { usdt: 5 }, { usdt: 10 }, { usdt: 50 }];

export const TokenAmountInput = memo(function TokenAmountInput() {
    const isMedium = useIsMedium();
    const { token, amount, selectedUsdtValue, latestCustomAmount, update } = useTipsStore();

    const handleAmountChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const value = event.currentTarget.value;
            if (value && !new RegExp(NUMERIC_INPUT_REGEXP_PATTERN).test(value)) return;

            const amount_ = value.replaceAll(/[,。]/g, '.');
            const RE_MATCH_FRACTION_AMOUNT = new RegExp(`^\\.\\d{0,${token?.decimals ?? 18}}$`);
            const RE_MATCH_WHOLE_AMOUNT = new RegExp(`^\\d*\\.?\\d{0,${token?.decimals ?? 18}}$`);

            if (RE_MATCH_FRACTION_AMOUNT.test(amount_)) {
                update({ amount: `0${amount_}`, latestCustomAmount: `0${amount_}` });
            } else if (amount_ === '' || RE_MATCH_WHOLE_AMOUNT.test(amount_)) {
                update({ amount: amount_, latestCustomAmount: amount_ });
            }
        },
        [token?.decimals, update],
    );

    const handleInputFocus = useCallback(
        (event: React.FocusEvent<HTMLInputElement>) => {
            if (!amount && latestCustomAmount) {
                update({ amount: latestCustomAmount });
                // move cursor to the end of the input
                const input = event.currentTarget;
                setTimeout(() => {
                    input.setSelectionRange(input.value.length, input.value.length);
                }, 0);
            }
        },
        [amount, latestCustomAmount, update],
    );

    return (
        <div className="mt-3 flex h-10 items-center gap-2 md:h-[50px] md:gap-4">
            {usdtValueConfigs.map((config) => (
                <ClickableButton
                    key={config.usdt}
                    className={classNames(
                        'text-medium hover:border-main h-full w-10 shrink-0 rounded-xl border transition-colors md:w-[50px]',
                        !amount && selectedUsdtValue === config.usdt
                            ? 'border-main text-main font-semibold'
                            : 'border-second text-second',
                    )}
                    onClick={() => {
                        update({ selectedUsdtValue: config.usdt, amount: '' });
                    }}
                >
                    ${config.usdt}
                </ClickableButton>
            ))}
            <div className="h-full min-w-0 flex-1">
                <input
                    className={classNames(
                        'focus:!border-highlight size-full rounded-xl border bg-transparent text-center outline-none transition-colors placeholder:text-[10px] focus:outline-none focus:ring-0 disabled:cursor-not-allowed md:placeholder:text-[13px]',
                        amount ? 'border-main' : 'border-second',
                    )}
                    placeholder={!isMedium ? t`Custom amount` : t`Custom token amount`}
                    value={amount}
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck="false"
                    inputMode="decimal"
                    pattern={NUMERIC_INPUT_REGEXP_PATTERN}
                    onChange={handleAmountChange}
                    onFocus={handleInputFocus}
                />
            </div>
        </div>
    );
});
