import { delay } from '@dimensiondev/utils';
import { type ReactNode, useState } from 'react';
import { createCallable } from 'react-call';

import {
    DialogOrDrawer,
    DialogOrDrawerContent,
    DialogOrDrawerHeader,
    DialogOrDrawerTitle,
} from '@/components/DialogOrDrawer.js';
import { Button, type ButtonProps } from '@/components/ui/button.js';

interface Props {
    // exit with animation
    hide?: boolean;
    title: ReactNode;
    message: ReactNode;
    button?: ReactNode;
    buttonLabel?: ReactNode;
    buttonVariants?: ButtonProps['variant'];
}

export const Confirm = createCallable<Props, boolean>(function ConfirmComponent({
    hide,
    call,
    title,
    message,
    button,
    buttonLabel,
    buttonVariants,
}) {
    const [open, setOpen] = useState(true);
    return (
        <DialogOrDrawer
            open={hide ?? open}
            onClose={async () => {
                setOpen(false);
                await delay(300);
                call.end(false);
            }}
        >
            <DialogOrDrawerContent>
                <div className="flex w-full flex-col">
                    <DialogOrDrawerHeader className="shrink-0 !flex-row">
                        <DialogOrDrawerTitle className="flex justify-start">{title}</DialogOrDrawerTitle>
                    </DialogOrDrawerHeader>
                    <div className="flex min-h-0 grow flex-col gap-6">
                        {message}
                        {button ??
                            (buttonLabel ? (
                                <Button
                                    className="font-bold"
                                    onClick={async () => {
                                        setOpen(false);
                                        await delay(300);
                                        call.end(true);
                                    }}
                                    variant={buttonVariants}
                                    rounded
                                >
                                    {buttonLabel}
                                </Button>
                            ) : null)}
                    </div>
                </div>
            </DialogOrDrawerContent>
        </DialogOrDrawer>
    );
});
