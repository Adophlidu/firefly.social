import { delay } from '@dimensiondev/utils';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { useCallback, useState } from 'react';
import { createCallable } from 'react-call';

import {
    DialogOrDrawer,
    DialogOrDrawerContent,
    DialogOrDrawerHeader,
    DialogOrDrawerTitle,
} from '@/components/DialogOrDrawer.js';
import { ConfirmButton } from '@/components/PinCodeModal/ConfirmButton.js';
import { ErrorMessage } from '@/components/PinCodeModal/ErrorMessage.js';
import { PinCodeModalHeader } from '@/components/PinCodeModal/PinCodeModalHeader.js';
import { StepDescription } from '@/components/PinCodeModal/StepDescription.js';
import { StepForm } from '@/components/PinCodeModal/StepForm.js';

interface Props {
    hide?: boolean;
}

export const PinCodeModal = createCallable<Props, string | null>(function PinCodeModalComponent({ call, hide }) {
    const [open, setOpen] = useState(true);

    const onSuccess = useCallback(
        (code: string | null) => {
            call.end(code);
        },
        [call],
    );

    return (
        <DialogOrDrawer
            open={hide ?? open}
            onClose={async () => {
                setOpen(false);
                await delay(300);
                onSuccess(null);
            }}
        >
            <DialogOrDrawerContent className="!m-0 !h-full !max-h-full w-full !rounded-none" bodyClassName="!p-0">
                <VisuallyHidden asChild>
                    <DialogOrDrawerHeader>
                        <DialogOrDrawerTitle>Pin Code</DialogOrDrawerTitle>
                    </DialogOrDrawerHeader>
                </VisuallyHidden>

                <div className="flex size-full flex-col">
                    <PinCodeModalHeader onClose={onSuccess} />
                    <div className="flex min-h-0 w-full flex-1 flex-col items-center justify-center gap-8">
                        <div className="text-second px-10 text-center text-sm">
                            <StepDescription />
                        </div>
                        <StepForm onSuccess={onSuccess} />
                        <ErrorMessage />
                    </div>
                    <ConfirmButton onSuccess={onSuccess} />
                </div>
            </DialogOrDrawerContent>
        </DialogOrDrawer>
    );
});
