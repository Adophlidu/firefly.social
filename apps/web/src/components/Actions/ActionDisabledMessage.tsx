import UserRemoveIcon from '@dimensiondev/assets/user-remove.svg';
import { Trans } from '@lingui/react/macro';
import type { ReactNode } from 'react';

interface Props {
    message: ReactNode;
}

export function ActionDisabledMessage({ message }: Props) {
    return (
        <div className="px-4 py-3">
            <div className="bg-bg flex items-center gap-2.5 rounded-lg px-4 py-1">
                <UserRemoveIcon width={24} height={24} className="text-second shrink-0" />
                <div className="min-w-0 flex-1 text-sm">
                    <span className="text-main font-bold leading-6">
                        <Trans>Reply restricted</Trans>
                    </span>
                    <p className="text-second leading-6">{message}</p>
                </div>
            </div>
        </div>
    );
}
