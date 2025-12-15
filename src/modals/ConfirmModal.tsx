import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { type CSSProperties, type ReactNode, type Ref, useState } from 'react';

import { ClickableButton } from '@/components/ClickableButton.js';
import { CloseButton } from '@/components/IconButton.js';
import { Modal } from '@/components/Modal.js';
import { TextOverflowTooltip } from '@/components/TextOverflowTooltip.js';
import { stopPropagation } from '@/helpers/stopEvent.js';
import { useSingletonModal } from '@/hooks/useSingletonModal.js';
import { SingletonModal, type SingletonModalRefCreator } from '@/libs/SingletonModal.js';

interface ConfirmModalOpenProps {
    title?: ReactNode;
    content: ReactNode;
    resetSize?: boolean;
    contentClass?: string;
    contentStyle?: CSSProperties;
    modalClass?: string;
    modalStyle?: CSSProperties;
    confirmButtonClass?: string;
    confirmButtonText?: ReactNode;
    cancelButtonText?: ReactNode;
    enableConfirmButton?: boolean;
    enableCancelButton?: boolean;
    enableCloseButton?: boolean;
    disableBackdropClose?: boolean;
    onConfirm?: () => void;
    onCancel?: () => void;
    variant?: 'normal' | 'secondary' | 'danger';
    textOverflowTooltip?: boolean;
}

/** Dismissing dialog returns null */
type ConfirmModalCloseResult = boolean | null;
interface Props {
    ref: Ref<SingletonModalRefCreator<ConfirmModalOpenProps, ConfirmModalCloseResult>>;
}

export function ConfirmModal({ ref }: Props) {
    const [props, setProps] = useState<ConfirmModalOpenProps>();

    const [open, dispatch] = useSingletonModal(ref, {
        onOpen: (props) => {
            setProps({
                ...props,
                variant: props.variant || 'danger',
                enableConfirmButton: props.enableConfirmButton ?? true,
                enableCancelButton: props.enableCancelButton ?? false,
                enableCloseButton: props.enableCloseButton ?? true,
                disableBackdropClose: props.disableBackdropClose ?? false,
                textOverflowTooltip: props.textOverflowTooltip ?? true,
            });
        },
        onClose: () => setProps(undefined),
    });

    if (!props) return null;

    return (
        <Modal
            disableBackdropClose={props.disableBackdropClose}
            open={open}
            onClose={() => {
                props.onCancel?.();
                dispatch?.close(null);
            }}
        >
            <div
                className={classNames(
                    'relative flex flex-col rounded-xl bg-bgModal shadow-popover transition-all dark:text-gray-950',
                    props.resetSize ? '' : 'w-[320px] max-w-[clamp(386px,90vw,95vw)] md:w-[355px]',
                    props.modalClass,
                )}
                style={props.modalStyle}
                onClick={stopPropagation}
            >
                <div className="inline-flex h-auto w-full items-center justify-center gap-4 rounded-t-[12px] p-4">
                    {props.enableCloseButton ? (
                        <CloseButton
                            onClick={() => {
                                props.onCancel?.();
                                dispatch?.close(null);
                            }}
                        />
                    ) : null}
                    {props.textOverflowTooltip && props.title ? (
                        <TextOverflowTooltip content={props.title}>
                            <div className="shrink grow basis-0 truncate text-center text-lg font-bold leading-snug text-main">
                                {props.title}
                            </div>
                        </TextOverflowTooltip>
                    ) : (
                        <div className="shrink grow basis-0 text-center text-lg font-bold leading-snug text-main">
                            {props.title || <Trans>Confirmation</Trans>}
                        </div>
                    )}

                    {props.enableCloseButton ? <div className="relative size-6" /> : null}
                </div>

                <div
                    style={props.contentStyle}
                    className={classNames('flex flex-1 flex-col gap-6 p-6 pt-0', props.contentClass)}
                >
                    {props.content}
                    {props.enableCancelButton || props.enableConfirmButton ? (
                        <div className="flex flex-col-reverse gap-4 md:flex-row md:gap-3">
                            {props.enableCancelButton ? (
                                <ClickableButton
                                    className="flex flex-1 items-center justify-center rounded-full border border-lightMain py-2 font-bold text-fourMain"
                                    onClick={() => {
                                        props.onCancel?.();
                                        dispatch?.close(false);
                                    }}
                                >
                                    {props.cancelButtonText || <Trans>Cancel</Trans>}
                                </ClickableButton>
                            ) : null}
                            {props.enableConfirmButton ? (
                                <ClickableButton
                                    className={classNames(
                                        'flex flex-1 items-center justify-center rounded-full py-2 font-bold',
                                        {
                                            'bg-main text-primaryBottom': props.variant === 'normal',
                                            'bg-commonDanger text-white': props.variant === 'danger',
                                            'border border-main bg-bottom text-main': props.variant === 'secondary',
                                        },
                                        props.confirmButtonClass,
                                    )}
                                    onClick={() => {
                                        props.onConfirm?.();
                                        dispatch?.close(true);
                                    }}
                                >
                                    {props.confirmButtonText || <Trans>Confirm</Trans>}
                                </ClickableButton>
                            ) : null}
                        </div>
                    ) : null}
                </div>
            </div>
        </Modal>
    );
}

export const ConfirmModalRef = new SingletonModal<ConfirmModalOpenProps, ConfirmModalCloseResult>();
