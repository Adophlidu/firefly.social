import BetSwitchIcon from '@dimensiondev/assets/bet-exchange.svg';
import type { ChangeEvent, FocusEvent, RefObject } from 'react';

import { ClickableButton } from '@/components/ClickableButton.js';
import { TokenIcon } from '@/components/TokenIcon.js';
import { DepositAmountInputType } from '@/hooks/deposit/depositAmountInputType.js';
import { cn } from '@/lib/utils.js';

interface DepositAmountToggleToken {
    logoUrl?: string;
}

interface DepositAmountFieldProps {
    id: string;
    inputRef: RefObject<HTMLInputElement | null>;
    inputProps: {
        value: string;
        onChange: (event: ChangeEvent<HTMLInputElement>) => void;
        onBlur?: (event: FocusEvent<HTMLInputElement>) => void;
    };
    inputType: DepositAmountInputType;
    placeholder: string;
    isInsufficientBalance: boolean;
    showUsdPrefix: boolean;
    toggle?: {
        payToken: DepositAmountToggleToken;
        receiveToken: DepositAmountToggleToken;
        secondaryText: string;
        onToggle: () => void;
    } | null;
}

export function DepositAmountField({
    id,
    inputRef,
    inputProps,
    inputType,
    placeholder,
    isInsufficientBalance,
    showUsdPrefix,
    toggle,
}: DepositAmountFieldProps) {
    const formattedValue =
        showUsdPrefix && inputType === DepositAmountInputType.Usd && inputProps.value
            ? `$${inputProps.value}`
            : inputProps.value;

    return (
        <label className="relative flex min-h-0 w-full flex-1 flex-col items-center justify-center gap-2" htmlFor={id}>
            <input
                id={id}
                {...inputProps}
                value={formattedValue}
                autoComplete="off"
                ref={inputRef}
                autoFocus
                className={cn(
                    'h-10 w-full border-none text-center text-[40px] font-bold leading-10 outline-none focus:outline-none focus:ring-0',
                    {
                        'text-danger': isInsufficientBalance,
                    },
                )}
                placeholder={placeholder}
            />
            {toggle ? (
                <ClickableButton className="flex h-3.5 items-center gap-1" onClick={toggle.onToggle}>
                    <TokenIcon
                        size={14}
                        icon={
                            inputType === DepositAmountInputType.Amount
                                ? toggle.receiveToken.logoUrl
                                : toggle.payToken.logoUrl
                        }
                    />
                    <span className="text-xs leading-[14px] text-second">{toggle.secondaryText}</span>
                    <BetSwitchIcon width={14} height={14} />
                </ClickableButton>
            ) : null}
        </label>
    );
}
