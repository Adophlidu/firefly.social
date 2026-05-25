import * as SwitchPrimitives from '@radix-ui/react-switch';
import { forwardRef } from 'react';

import { cn } from '@/lib/utils.js';

const Switch = forwardRef<
    React.ComponentRef<typeof SwitchPrimitives.Root>,
    React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
    <SwitchPrimitives.Root
        className={cn(
            'relative inline-flex h-[31px] w-[51px] shrink-0 cursor-pointer items-center rounded-full transition-colors data-[state=checked]:bg-main data-[state=unchecked]:bg-third dark:data-[state=checked]:bg-primaryBottom',
            className,
        )}
        {...props}
        ref={ref}
    >
        <SwitchPrimitives.Thumb
            className={cn(
                'pointer-events-none inline-block size-[27px] rounded-full bg-white shadow-sm transition-transform data-[state=checked]:translate-x-[22px] data-[state=unchecked]:translate-x-[2px] dark:bg-third',
            )}
        />
    </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
