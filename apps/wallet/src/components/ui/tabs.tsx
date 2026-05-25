import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils.js';

const Tabs = TabsPrimitive.Root;

const tabsListVariants = cva('inline-flex items-center justify-center', {
    variants: {
        variant: {
            default: 'space-x-4',
            second: 'space-x-0 border-b border-b-secondaryLine justify-start h-11 gap-4',
            solid: 'space-x-0 border border-secondaryLine py-1 px-[5px] rounded-[6px] min-w-0',
            subtle: 'space-x-2 py-1.5',
            bold: 'space-x-3',
        },
    },
    defaultVariants: {
        variant: 'default',
    },
});

interface TabsListProps
    extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>, VariantProps<typeof tabsListVariants> {}

const TabsList = React.forwardRef<React.ElementRef<typeof TabsPrimitive.List>, TabsListProps>(
    ({ className, variant, ...props }, ref) => (
        <TabsPrimitive.List ref={ref} className={cn(tabsListVariants({ variant, className }))} {...props} />
    ),
);
TabsList.displayName = TabsPrimitive.List.displayName;

const tabsTriggerVariants = cva(
    'inline-flex items-center justify-center whitespace-nowrap transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40',
    {
        variants: {
            variant: {
                default: [
                    'h-11 border-b-2 px-4 text-center font-bold leading-11 hover:cursor-pointer hover:text-main md:h-15 md:py-[18px] md:leading-6',
                    'data-[state=active]:border-farcasterPrimary data-[state=active]:text-main',
                    'data-[state=inactive]:border-transparent data-[state=inactive]:text-third',
                    'flex-1 text-sm sm:text-xl',
                ],
                second: [
                    'h-11 leading-11 border-b-2 text-center text-base font-semibold hover:cursor-pointer hover:text-main px-1',
                    'data-[state=active]:border-current data-[state=active]:text-main',
                    'data-[state=inactive]:border-transparent data-[state=inactive]:text-third',
                ],
                solid: [
                    'h-8 rounded-[4px] px-[12px] py-[6px] transition-colors hover:text-highlight',
                    'data-[state=active]:bg-bg data-[state=active]:text-highlight',
                    'data-[state=inactive]:cursor-pointer data-[state=inactive]:text-second',
                    'text-sm leading-5 font-medium',
                ],
                subtle: [
                    'h-8 rounded-full border px-4 leading-8 text-main duration-100',
                    'data-[state=active]:border-line2 data-[state=active]:bg-bg',
                    'data-[state=inactive]:border-transparent data-[state=inactive]:text-third',
                    'text-sm font-semibold cursor-pointer',
                ],
                bold: ['text-lg font-bold leading-6 text-third data-[state=active]:text-main'],
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    },
);

interface TabsTriggerProps
    extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>, VariantProps<typeof tabsTriggerVariants> {}

const TabsTrigger = React.forwardRef<React.ElementRef<typeof TabsPrimitive.Trigger>, TabsTriggerProps>(
    ({ className, variant, ...props }, ref) => (
        <TabsPrimitive.Trigger ref={ref} className={cn(tabsTriggerVariants({ variant, className }))} {...props} />
    ),
);
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
    React.ElementRef<typeof TabsPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
    <TabsPrimitive.Content
        ref={ref}
        className={cn(
            'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            className,
        )}
        {...props}
    />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsContent, TabsList, tabsListVariants, TabsTrigger, tabsTriggerVariants };
