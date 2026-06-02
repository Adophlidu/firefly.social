import CloseIcon from '@dimensiondev/assets/close.svg';
import { t } from '@lingui/core/macro';
import type { ReactNode } from 'react';
import { type ExternalToast, toast } from 'sonner';

import { cn } from '@/lib/utils.js';

export function toastLoading(message: ReactNode, options?: ExternalToast) {
    if (!options?.id) return toast.loading(message, options);

    return toast.loading(
        <div className="flex w-full items-center gap-2">
            <div className="min-w-0 flex-1">{message}</div>
            <button
                type="button"
                className={cn('shrink-0 cursor-pointer rounded p-0.5 text-main outline-none')}
                aria-label={t`Dismiss`}
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => {
                    event.stopPropagation();
                    toast.dismiss(options.id);
                }}
            >
                <CloseIcon width={16} height={16} />
            </button>
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
