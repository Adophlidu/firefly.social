import type { ReactNode } from 'react';

import { DepositQuickAmountBar } from '@/components/Deposit/DepositQuickAmountBar.js';
import { Button } from '@/components/ui/button.js';
import { cn } from '@/lib/utils.js';

interface DepositFormFooterProps {
    receiveRow: ReactNode;
    onQuickAmountPick: (rate: number) => void;
    buttonLabel: ReactNode;
    disabled: boolean;
    loading: boolean;
    onSubmit: () => void;
    className?: string;
}

export function DepositFormFooter({
    receiveRow,
    onQuickAmountPick,
    buttonLabel,
    disabled,
    loading,
    onSubmit,
    className,
}: DepositFormFooterProps) {
    return (
        <div className={cn('w-full space-y-4 pb-4', className)}>
            {receiveRow}
            <DepositQuickAmountBar onPick={onQuickAmountPick} />
            <Button
                variant="primary"
                size="lg"
                className="h-12 w-full rounded-full"
                disabled={disabled || loading}
                loading={loading}
                onClick={onSubmit}
            >
                {buttonLabel}
            </Button>
        </div>
    );
}
