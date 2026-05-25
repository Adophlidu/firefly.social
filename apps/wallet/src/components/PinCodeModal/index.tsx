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
import { getMobileDevice } from '@/helpers/getMobileDevice.js';
import { cn } from '@/lib/utils.js';

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

    const isMobile = getMobileDevice() !== 'unknown';

    return (
        <DialogOrDrawer
            open={hide ?? open}
            onClose={async () => {
                setOpen(false);
                await delay(300);
                onSuccess(null);
            }}
        >
            {/* Pin Code Modal will open anywhere, must has highest z-index */}
            <DialogOrDrawerContent className="!m-0 !h-full !max-h-full w-full !rounded-none" bodyClassName="!p-0">
                <VisuallyHidden asChild>
                    <DialogOrDrawerHeader>
                        <DialogOrDrawerTitle>Pin Code</DialogOrDrawerTitle>
                    </DialogOrDrawerHeader>
                </VisuallyHidden>

                <div className="flex size-full flex-col">
                    <PinCodeModalHeader onClose={onSuccess} />
                    <div
                        className={cn(
                            'flex min-h-0 w-full flex-1 flex-col items-center gap-8',
                            isMobile ? 'pt-10' : 'justify-center',
                        )}
                    >
                        <div className="px-10 text-center text-sm text-second">
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
