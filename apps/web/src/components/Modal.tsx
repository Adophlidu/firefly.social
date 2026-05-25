import { classNames } from '@dimensiondev/utils';
import { Dialog, Transition } from '@headlessui/react';
import { noop } from 'lodash-es';
import { Fragment, memo, type ReactNode, useEffect, useRef } from 'react';

import { ModalBody } from '@/components/ModalBody.js';
import { ModalTitle } from '@/components/ModalTitle.js';
import { stopPropagation } from '@/helpers/stopEvent.js';

export interface ModalProps {
    className?: string;
    open: boolean;
    size?: 'xs' | 'sm' | 'md' | 'lg';
    onClose: () => void;
    onBack?: () => void;
    children?: ReactNode;
    title?: ReactNode;
    enableClose?: boolean;
    enableBack?: boolean;
    enableBackdrop?: boolean;
    /**
     * Close the `onClose` of the dialog.
     * The `onClose` of Dialog will respond to all click events outside the `Dialog.Panel`.
     * Problems may occur when ConfirmModal is in use. Note, this will also close all shortcut keys for close.
     */
    disableDialogClose?: boolean;
    disableBackdropClose?: boolean;
    dialogClassName?: string;
    dialogPanelClassName?: string;
    titleClassName?: string;
    panelClassName?: string;
}

export const Modal = memo(function Modal({
    className,
    open,
    onClose,
    onBack,
    children,
    title,
    size,
    enableClose = false,
    enableBack = false,
    enableBackdrop = true,
    disableDialogClose = true,
    disableBackdropClose = false,
    dialogClassName,
    dialogPanelClassName,
    titleClassName,
    panelClassName,
}: ModalProps) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;

        const scrollY = window.scrollY;

        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.width = '100%';

        return () => {
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.width = '';
            window.scrollTo(0, scrollY);
        };
    }, [open]);

    return (
        <Transition appear show={open} as={Fragment}>
            <Dialog
                className={classNames('relative z-modal', dialogClassName)}
                onClose={disableDialogClose ? noop : onClose}
                tabIndex={-1}
            >
                <div className="fixed inset-0">
                    <div
                        className={classNames(
                            'flex min-h-full items-center justify-center p-0 text-center md:p-4',
                            dialogPanelClassName,
                        )}
                        ref={ref}
                        tabIndex={-1}
                    >
                        {enableBackdrop ? (
                            <Transition.Child
                                as="div"
                                className="fixed inset-0 bg-main/25"
                                enter="ease-out duration-300"
                                enterFrom="opacity-0"
                                enterTo="opacity-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100"
                                leaveTo="opacity-0"
                                onClick={(ev) => {
                                    ev.preventDefault();
                                    ev.stopPropagation();
                                    if (disableBackdropClose) return;
                                    onClose?.();
                                }}
                            />
                        ) : null}
                        <Transition.Child
                            as="div"
                            className="contents"
                            enter="ease-out duration-300"
                            enterFrom="opacity-0"
                            enterTo="opacity-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                        >
                            {title ? (
                                <div
                                    className={classNames(
                                        'relative z-10 flex flex-col rounded-md bg-lightBottom dark:bg-darkBottom md:rounded-xl',
                                        className,
                                        {
                                            'w-[520px]': size === 'lg',
                                            'w-[485px]': size === 'md',
                                            'w-[400px]': size === 'sm',
                                            'w-[355px]': size === 'xs',
                                        },
                                    )}
                                    onClick={stopPropagation}
                                >
                                    <ModalTitle
                                        title={title}
                                        enableClose={enableClose}
                                        enableBack={enableBack}
                                        onClose={onClose}
                                        onBack={onBack}
                                        className={titleClassName}
                                    />
                                    <ModalBody className={panelClassName}>{children}</ModalBody>
                                </div>
                            ) : (
                                children
                            )}
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
});
