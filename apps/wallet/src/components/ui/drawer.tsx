import CloseIcon from '@dimensiondev/assets/close.svg';
import * as React from 'react';
import { Drawer as DrawerPrimitive } from 'vaul';

import { cn } from '@/lib/utils.js';

type DrawerProps = React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Root> & {
    /**
     * When `true`, the drawer will lock document/body scrolling while open.
     * Defaults to `false` (allow body scroll).
     */
    lockBodyScroll?: boolean;
};

function Drawer({ lockBodyScroll = false, disablePreventScroll = false, noBodyStyles, ...props }: DrawerProps) {
    return (
        <DrawerPrimitive.Root
            disablePreventScroll={disablePreventScroll ?? lockBodyScroll}
            // Also avoid iOS Safari's `position: fixed` body workaround when we want the page to remain scrollable.
            noBodyStyles={noBodyStyles ?? !lockBodyScroll}
            {...props}
        />
    );
}

Drawer.displayName = 'Drawer';

const DrawerTrigger = DrawerPrimitive.Trigger;

const DrawerPortal = DrawerPrimitive.Portal;

const DrawerClose = DrawerPrimitive.Close;

const DrawerOverlay = React.forwardRef<
    React.ElementRef<typeof DrawerPrimitive.Overlay>,
    React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>
>(({ className, ...props }, ref) => (
    <DrawerPrimitive.Overlay
        ref={ref}
        className={cn(
            'fixed inset-0 z-50 bg-main/25 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            className,
        )}
        {...props}
    />
));
DrawerOverlay.displayName = DrawerPrimitive.Overlay.displayName;

type DrawerContentProps = React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content> & {
    bodyClassName?: string;
};

const DrawerContent = React.forwardRef<React.ElementRef<typeof DrawerPrimitive.Content>, DrawerContentProps>(
    ({ className, bodyClassName, children, ...props }, ref) => (
        <DrawerPortal>
            <DrawerOverlay />
            <DrawerPrimitive.Content
                ref={ref}
                data-vaul-custom-container="true"
                className={cn(
                    'fixed inset-x-0 bottom-0 z-50 mt-12 flex max-h-[92svh] flex-col overflow-hidden rounded-t-xl bg-lightBottom shadow-lg transition ease-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom-1/4 dark:bg-darkBottom sm:rounded-t-2xl',
                    className,
                )}
                {...props}
            >
                <div
                    className={cn(
                        'no-scrollbar flex min-h-0 w-full flex-1 flex-col overflow-y-auto px-6 pb-6 pt-0',
                        bodyClassName,
                    )}
                >
                    {children}
                </div>
            </DrawerPrimitive.Content>
        </DrawerPortal>
    ),
);
DrawerContent.displayName = DrawerPrimitive.Content.displayName;

function DrawerHeader({
    className,
    closeButton = true,
    children,
    ...props
}: React.HTMLAttributes<HTMLDivElement> & {
    closeButton?: boolean;
}) {
    return (
        <div
            className={cn(
                'sticky top-0 z-20 flex w-full flex-row-reverse items-center justify-between bg-lightBottom py-6 text-center dark:bg-darkBottom sm:text-left',
                className,
            )}
            {...props}
        >
            {children}
            {closeButton ? (
                <DrawerPrimitive.Close asChild>
                    <button
                        type="button"
                        className="dark:hover:bg-darkBg rounded p-1 text-main outline-none transition hover:bg-lightBg focus-visible:ring-2 focus-visible:ring-main focus-visible:ring-offset-2"
                    >
                        <CloseIcon className="size-6" />
                        <span className="sr-only">Close</span>
                    </button>
                </DrawerPrimitive.Close>
            ) : null}
        </div>
    );
}

DrawerHeader.displayName = 'DrawerHeader';

function DrawerFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn('mt-auto flex flex-col-reverse gap-2 pt-4 sm:flex-row sm:justify-end', className)}
            {...props}
        />
    );
}

DrawerFooter.displayName = 'DrawerFooter';

const DrawerTitle = React.forwardRef<
    React.ElementRef<typeof DrawerPrimitive.Title>,
    React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>
>(({ className, ...props }, ref) => (
    <DrawerPrimitive.Title
        ref={ref}
        className={cn('flex-grow text-center text-lg font-bold leading-8 first:mr-6', className)}
        {...props}
    />
));
DrawerTitle.displayName = DrawerPrimitive.Title.displayName;

const DrawerDescription = React.forwardRef<
    React.ElementRef<typeof DrawerPrimitive.Description>,
    React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>
>(({ className, ...props }, ref) => (
    <DrawerPrimitive.Description ref={ref} className={cn('text-muted-foreground text-sm', className)} {...props} />
));
DrawerDescription.displayName = DrawerPrimitive.Description.displayName;

export {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerOverlay,
    DrawerPortal,
    DrawerTitle,
    DrawerTrigger,
};
