'use client';

import { DialogTitle } from '@headlessui/react';
import { Trans } from '@lingui/react/macro';

import { CloseButton } from '@/components/IconButton.js';
import { Modal } from '@/components/Modal.js';
import {
    SendTransactionModalContent,
    type SendTransactionModalContentProps,
} from '@/components/SendTransactionModal/SendTransactionModalContent.js';

export interface Props {
    open?: boolean;
    onClose?: () => void;
    contentProps?: SendTransactionModalContentProps;
}

export function SendTransactionModal({ open, onClose, contentProps }: Props) {
    return (
        <Modal open={!!open} onClose={() => onClose?.()} dialogClassName="z-50">
            <div className="z-50 flex w-[calc(100%-40px)] max-w-[432px] flex-col rounded-md bg-lightBottom p-6 text-medium text-lightMain shadow-popover transition-all dark:bg-darkBottom md:rounded-xl">
                <DialogTitle as="h3" className="relative mb-4 h-10 shrink-0 pt-safe">
                    <CloseButton
                        onClick={() => onClose?.()}
                        className="absolute left-0 top-1/2 -translate-y-1/2 cursor-pointer text-main"
                    />
                    <span className="flex h-full w-full items-center justify-center text-lg font-bold text-main">
                        <Trans>Send</Trans>
                    </span>
                </DialogTitle>
                <div className="flex min-h-0 flex-1">
                    {contentProps ? <SendTransactionModalContent className="flex-1" {...contentProps} /> : null}
                </div>
            </div>
        </Modal>
    );
}
