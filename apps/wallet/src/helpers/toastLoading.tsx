import CloseIcon from '@dimensiondev/assets/close.svg';
import type { ReactNode } from 'react';
import { type ExternalToast, toast } from 'sonner';

export function toastLoading(message: ReactNode, options?: ExternalToast) {
    if (!options?.id) return toast.loading(message, options);

    return toast.loading(
        <div className="flex w-full items-center gap-2">
            <div className="min-w-0 flex-1">{message}</div>
            <CloseIcon className="shrink-0" width={16} height={16} onClick={() => toast.dismiss(options.id)} />
        </div>,
        {
            ...options,
            className: 'custom-toast-loading',
            classNames: {
                content: 'custom-loading-toast-content',
            },
        },
    );
}
