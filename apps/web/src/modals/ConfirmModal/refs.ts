import { type CSSProperties, type ReactNode } from 'react';

import { SingletonModal, type SingletonModalRefCreator } from '@/libs/SingletonModal.js';

export interface ConfirmModalOpenProps {
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
    errorMessage?: ReactNode;
}

/** Dismissing dialog returns null */
export type ConfirmModalCloseResult = boolean | null;

export type ConfirmModalRefType = SingletonModalRefCreator<ConfirmModalOpenProps, ConfirmModalCloseResult>;

export const ConfirmModalRef = new SingletonModal<ConfirmModalOpenProps, ConfirmModalCloseResult>();
