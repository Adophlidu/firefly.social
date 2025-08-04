import { DialogPanel } from '@headlessui/react';
import { memo, type PropsWithChildren } from 'react';

interface ModalBodyProps extends PropsWithChildren {}

export const ModalBody = memo(function ModalBody({ children }: ModalBodyProps) {
    return <DialogPanel className="p-6 pt-0">{children}</DialogPanel>;
});
