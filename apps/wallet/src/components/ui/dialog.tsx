import CloseIcon from '@dimensiondev/assets/close.svg';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import type { HTMLAttributes } from 'react';
import * as React from 'react';

import { preventModalDismissOnSonner } from '@/helpers/preventModalDismissOnSonner.js';
import { cn } from '@/lib/utils.js';

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Overlay>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
    <DialogPortal>
        <DialogPrimitive.Overlay
            ref={ref}
            className={cn(
                'fixed inset-0 z-50 bg-main/25 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
                className,
            )}
            {...props}
        />
    </DialogPortal>
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, onPointerDownOutside, onInteractOutside, onFocusOutside, ...props }, ref) => (
    <DialogPortal>
        <DialogPrimitive.Content
            ref={ref}
            className={cn(
                'fixed left-[50%] top-[50%] z-50 flex max-h-svh w-full max-w-[480px] translate-x-[-50%] translate-y-[-50%] flex-col items-center rounded-md bg-lightBottom px-6 pb-6 shadow-lg outline-none duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] dark:bg-darkBottom sm:rounded-lg md:rounded-xl',
                className,
            )}
            onPointerDownOutside={(event) => {
                preventModalDismissOnSonner(event);
                onPointerDownOutside?.(event);
            }}
            onInteractOutside={(event) => {
                preventModalDismissOnSonner(event);
                onInteractOutside?.(event);
            }}
            onFocusOutside={(event) => {
                preventModalDismissOnSonner(event);
                onFocusOutside?.(event);
            }}
            {...props}
        >
            {children}
        </DialogPrimitive.Content>
    </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

function DialogHeader({
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
                'sticky top-0 z-20 line-clamp-1 flex w-full flex-shrink-0 flex-col bg-lightBottom px-8 py-6 text-center dark:bg-darkBottom sm:text-left',
                className,
            )}
            {...props}
        >
            {closeButton ? (
                <DialogPrimitive.Close asChild>
                    <DialogTopButton alt="Close" Icon={CloseIcon} />
                </DialogPrimitive.Close>
            ) : null}
            {children}
        </div>
    );
}

DialogHeader.displayName = 'DialogHeader';

function DialogTopButton({
    Icon,
    className,
    alt,
    ...props
}: HTMLAttributes<HTMLButtonElement> & {
    Icon: React.ComponentType<{ className?: string }>;
    alt?: string;
}) {
    return (
        <button
            {...props}
            className={cn(
                'absolute left-0 top-6 cursor-pointer rounded p-1 text-main outline-none hover:bg-lightBg',
                className,
            )}
        >
            <Icon className="size-6" />
            {alt ? <span className="sr-only">{alt}</span> : null}
        </button>
    );
}

DialogTopButton.displayName = 'DialogTopButton';

function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)} {...props} />
    );
}

DialogFooter.displayName = 'DialogFooter';

const DialogTitle = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Title>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
    <DialogPrimitive.Title ref={ref} className={cn('text-center text-lg font-bold leading-8', className)} {...props} />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Description>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
    <DialogPrimitive.Description ref={ref} className={cn('text-muted-foreground text-sm', className)} {...props} />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogOverlay,
    DialogPortal,
    DialogTitle,
    DialogTopButton,
    DialogTrigger,
};
