import { Trans } from '@lingui/react/macro';

const QUICK_RATES = [0.25, 0.5, 0.75, 1] as const;

interface DepositQuickAmountBarProps {
    onPick: (rate: number) => void;
}

export function DepositQuickAmountBar({ onPick }: DepositQuickAmountBarProps) {
    return (
        <div className="flex items-center justify-between gap-4">
            {QUICK_RATES.map((rate) => (
                <button
                    key={rate}
                    type="button"
                    className="h-8 w-[70px] rounded-full bg-lightBg text-center font-semibold leading-8 duration-75 active:scale-95 active:bg-main/10"
                    onClick={() => onPick(rate)}
                >
                    {rate === 1 ? <Trans>Max</Trans> : `${rate * 100}%`}
                </button>
            ))}
        </div>
    );
}
