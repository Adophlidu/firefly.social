import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { Spinner } from '@/components/ui/spinner.js';
import { cn } from '@/lib/utils.js';

const buttonVariants = cva(
    'inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
    {
        variants: {
            variant: {
                default: 'bg-primary text-primary-foreground shadow hover:bg-primary/90',
                primary: 'bg-main text-white dark:bg-white dark:text-black shadow hover:bg-main/90',
                destructive: 'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
                outline: 'border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground',
                secondary: 'bg-lightBg text-secondary-foreground shadow-sm hover:bg-lightBg/80',
                ghost: 'hover:bg-accent hover:text-accent-foreground',
                link: 'text-primary underline-offset-4 hover:underline',
                danger: 'bg-danger text-bg shadow hover:bg-danger/90 dark:text-white dark:hover:bg-danger/90',
            },
            size: {
                default: 'h-9 px-4 py-2',
                sm: 'h-8 rounded-md px-3 text-xs',
                lg: 'h-10 rounded-md px-8',
                icon: 'h-9 w-9',
            },
            colorPattern: {
                danger: 'bg-[#FF564D] hover:bg-[#FF564D] text-white',
                success: 'bg-[#48AD3C] hover:bg-[#48AD3C] text-white',
                purple: 'bg-highlight text-white',
            },
            rounded: {
                true: 'rounded-full',
                false: 'rounded-md',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
            rounded: false,
        },
    },
);

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
        VariantProps<typeof buttonVariants> {
    asChild?: boolean;
    loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    (
        { className, variant, rounded, size, colorPattern, asChild = false, loading = false, children, ...props },
        ref,
    ) => {
        const Comp = asChild ? Slot : 'button';
        return (
            <Comp
                className={cn(buttonVariants({ variant, size, rounded, colorPattern, className }))}
                ref={ref}
                {...props}
            >
                {loading ? <Spinner /> : children}
            </Comp>
        );
    },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
