import ComebackIcon from '@dimensiondev/assets/comeback2.svg';
import type { HTMLProps } from 'react';

import { Button } from '@/components/ui/button.js';
import { useComeback } from '@/components/useComeback.js';
import { cn } from '@/lib/utils.js';

export function NavigationBar({
    children,
    className,
    onBack,
}: HTMLProps<'div'> & {
    /**
     * Override default "comeback" behavior.
     * If provided, clicking the back button will call this handler directly.
     */
    onBack?: () => void;
}) {
    const comeback = useComeback();
    return (
        <div
            className={cn(
                'relative flex h-11 w-full items-center justify-center text-center text-lg font-semibold',
                className,
            )}
        >
            <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 [&_svg]:size-6"
                onClick={() => (onBack ? onBack() : comeback())}
            >
                <ComebackIcon />
            </Button>
            {children}
        </div>
    );
}

export function NavigationBarRight({ children, className }: HTMLProps<'div'>) {
    return (
        <div className={cn('absolute right-4 top-1/2 flex -translate-y-1/2 items-center gap-4', className)}>
            {children}
        </div>
    );
}
