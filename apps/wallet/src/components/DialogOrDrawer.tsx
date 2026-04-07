import * as React from 'react';
import { useMediaQuery } from 'usehooks-ts';

import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogOverlay,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog.js';
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from '@/components/ui/drawer.js';
import { cn } from '@/lib/utils.js';

type DialogRootProps = React.ComponentProps<typeof Dialog>;
type DrawerRootProps = React.ComponentProps<typeof Drawer>;

interface DialogOrDrawerContextValue {
    isDesktop: boolean;
}

const DialogOrDrawerContext = React.createContext<DialogOrDrawerContextValue | null>(null);

function useDialogOrDrawerContext(component: string) {
    const context = React.useContext(DialogOrDrawerContext);
    if (!context) {
        throw new Error(`${component} must be used within a DialogOrDrawer component.`);
    }
    return context;
}

export type DialogOrDrawerProps = DialogRootProps &
    DrawerRootProps & {
        /**
         * CSS media query string used to determine when to render the desktop dialog variant.
         * Defaults to `(min-width: 619px)`.
         */
        desktopBreakpoint?: string;
    };

function DialogOrDrawer({ children, desktopBreakpoint = '(min-width: 619px)', ...props }: DialogOrDrawerProps) {
    const isDesktop = useMediaQuery(desktopBreakpoint, { defaultValue: true });
    const RootComponent = isDesktop ? Dialog : Drawer;
    const contextValue = React.useMemo(() => ({ isDesktop }), [isDesktop]);

    return (
        <DialogOrDrawerContext.Provider value={contextValue}>
            <RootComponent {...props}>{children}</RootComponent>
        </DialogOrDrawerContext.Provider>
    );
}

DialogOrDrawer.displayName = 'DialogOrDrawer';

const DialogOrDrawerTrigger = React.forwardRef<
    React.ElementRef<typeof DialogTrigger>,
    React.ComponentPropsWithoutRef<typeof DialogTrigger> & React.ComponentPropsWithoutRef<typeof DrawerTrigger>
>((props, ref) => {
    const { isDesktop } = useDialogOrDrawerContext('DialogOrDrawerTrigger');
    const TriggerComponent = isDesktop ? DialogTrigger : DrawerTrigger;
    return <TriggerComponent ref={ref} {...props} />;
});

DialogOrDrawerTrigger.displayName = 'DialogOrDrawerTrigger';

const DialogOrDrawerClose = React.forwardRef<
    React.ElementRef<typeof DialogClose>,
    React.ComponentPropsWithoutRef<typeof DialogClose> & React.ComponentPropsWithoutRef<typeof DrawerClose>
>((props, ref) => {
    const { isDesktop } = useDialogOrDrawerContext('DialogOrDrawerClose');
    const CloseComponent = isDesktop ? DialogClose : DrawerClose;
    return <CloseComponent ref={ref} {...props} />;
});

DialogOrDrawerClose.displayName = 'DialogOrDrawerClose';

const DialogOrDrawerContent = React.forwardRef<
    React.ElementRef<typeof DialogContent>,
    React.ComponentPropsWithoutRef<typeof DialogContent> & React.ComponentPropsWithoutRef<typeof DrawerContent>
>(({ children, ...props }, ref) => {
    const { isDesktop } = useDialogOrDrawerContext('DialogOrDrawerContent');
    if (isDesktop) {
        return (
            <>
                <DialogOverlay />
                <DialogContent ref={ref} {...props}>
                    {children}
                </DialogContent>
            </>
        );
    }
    return (
        <DrawerContent ref={ref} {...props}>
            {children}
        </DrawerContent>
    );
});

DialogOrDrawerContent.displayName = 'DialogOrDrawerContent';

function DialogOrDrawerHeader(
    props: React.ComponentPropsWithoutRef<typeof DialogHeader> & React.ComponentPropsWithoutRef<typeof DrawerHeader>,
) {
    const { isDesktop } = useDialogOrDrawerContext('DialogOrDrawerHeader');
    const HeaderComponent = isDesktop ? DialogHeader : DrawerHeader;
    return <HeaderComponent {...props} />;
}

DialogOrDrawerHeader.displayName = 'DialogOrDrawerHeader';

function DialogOrDrawerFooter(
    props: React.ComponentPropsWithoutRef<typeof DialogFooter> & React.ComponentPropsWithoutRef<typeof DrawerFooter>,
) {
    const { isDesktop } = useDialogOrDrawerContext('DialogOrDrawerFooter');
    const FooterComponent = isDesktop ? DialogFooter : DrawerFooter;
    return <FooterComponent {...props} />;
}

DialogOrDrawerFooter.displayName = 'DialogOrDrawerFooter';

const DialogOrDrawerTitle = React.forwardRef<
    React.ElementRef<typeof DialogTitle>,
    React.ComponentPropsWithoutRef<typeof DialogTitle> & React.ComponentPropsWithoutRef<typeof DrawerTitle>
>((props, ref) => {
    const { isDesktop } = useDialogOrDrawerContext('DialogOrDrawerTitle');
    const TitleComponent = isDesktop ? DialogTitle : DrawerTitle;
    return <TitleComponent ref={ref} {...props} />;
});

DialogOrDrawerTitle.displayName = 'DialogOrDrawerTitle';

const DialogOrDrawerDescription = React.forwardRef<
    React.ElementRef<typeof DialogDescription>,
    React.ComponentPropsWithoutRef<typeof DialogDescription> & React.ComponentPropsWithoutRef<typeof DrawerDescription>
>((props, ref) => {
    const { isDesktop } = useDialogOrDrawerContext('DialogOrDrawerDescription');
    const DescriptionComponent = isDesktop ? DialogDescription : DrawerDescription;
    return <DescriptionComponent ref={ref} {...props} />;
});

DialogOrDrawerDescription.displayName = 'DialogOrDrawerDescription';

function DialogOrDrawerTopButton({
    Icon,
    className,
    alt,
    ...props
}: React.HTMLAttributes<HTMLButtonElement> & {
    Icon: React.ComponentType<{ className?: string }>;
    alt?: string;
}) {
    return (
        <button
            type="button"
            className={cn(
                'dark:hover:bg-darkBg text-main hover:bg-lightBg focus-visible:ring-main absolute left-0 top-6 cursor-pointer rounded p-1 outline-none transition focus-visible:ring-2 focus-visible:ring-offset-2',
                className,
            )}
            {...props}
        >
            <Icon className="size-6" />
            {alt ? <span className="sr-only">{alt}</span> : null}
        </button>
    );
}

DialogOrDrawerTopButton.displayName = 'DialogOrDrawerTopButton';

export {
    DialogOrDrawer,
    DialogOrDrawerClose,
    DialogOrDrawerContent,
    DialogOrDrawerDescription,
    DialogOrDrawerFooter,
    DialogOrDrawerHeader,
    DialogOrDrawerTitle,
    DialogOrDrawerTopButton,
    DialogOrDrawerTrigger,
};
