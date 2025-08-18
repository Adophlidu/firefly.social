import { DialogTitle } from '@headlessui/react';
import { memo } from 'react';

import { BackButton, CloseButton } from '@/components/IconButton.js';
import { classNames } from '@/helpers/classNames.js';

interface ModalTitleProps {
    className?: string;
    title: React.ReactNode;
    actions?: React.ReactNode;
    enableClose?: boolean;
    enableBack?: boolean;
    onBack?: () => void;
    onClose?: () => void;
}

export const ModalTitle = memo(function ModalTitle({
    className,
    title,
    actions,
    enableClose = true,
    enableBack = false,
    onBack,
    onClose,
}: ModalTitleProps) {
    return (
        <DialogTitle
            as="div"
            className={classNames('flex w-full items-center justify-center gap-2 rounded-t-[12px] p-6', className)}
        >
            {enableClose ? (
                <CloseButton onClick={() => onClose?.()} className="cursor-pointer text-main" />
            ) : enableBack ? (
                <BackButton onClick={() => onBack?.()} className="cursor-pointer text-main" />
            ) : null}
            <div className="h-6 shrink grow basis-0 text-center text-lg font-bold leading-snug text-main">{title}</div>
            <div className="flex h-8 w-8 items-center justify-end">{actions}</div>
        </DialogTitle>
    );
});
