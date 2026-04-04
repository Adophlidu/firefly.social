import { classNames } from '@dimensiondev/utils';
import { memo, type PropsWithChildren } from 'react';

interface ModalBodyProps extends PropsWithChildren {
    className?: string;
}

export const ModalBody = memo(function ModalBody({ children, className }: ModalBodyProps) {
    return <div className={classNames('p-6 pt-0', className)}>{children}</div>;
});
