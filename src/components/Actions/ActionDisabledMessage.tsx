import { Trans } from '@lingui/react/macro';
import type { ReactNode } from 'react';

import UserRemoveIcon from '@/assets/user-remove.svg';

interface Props {
    message: ReactNode;
}

export function ActionDisabledMessage({ message }: Props) {
    return (
        <div className="px-4 py-3">
            <div className="flex items-center gap-2.5 rounded-lg bg-bg px-4 py-1">
                <UserRemoveIcon width={24} height={24} className="shrink-0 text-second" />
                <div className="min-w-0 flex-1 text-sm">
                    <span className="font-bold leading-6 text-main">
                        <Trans>Reply restricted</Trans>
                    </span>
                    <p className="leading-6 text-second">{message}</p>
                </div>
            </div>
        </div>
    );
}
