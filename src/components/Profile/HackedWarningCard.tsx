import { Trans } from '@lingui/react/macro';
import { memo } from 'react';

import DangerIcon from '@/assets/danger.svg';

export const HackedWarningCard = memo(function HackedWarningCard() {
    return (
        <div className="mt-2.5 px-6">
            <div className="flex items-center text-lg font-bold text-danger">
                <DangerIcon width={14} height={14} />
                <h2 className="ml-2">Hacked wallet detected</h2>
            </div>
            <p className="ml-[22px] mt-1 text-sm text-lightSecond">
                <Trans>
                    This wallet has been flagged as compromised. Please do not trust or interact with it. Avoid any
                    transactions or sharing of sensitive information. Stay safe!
                </Trans>
            </p>
        </div>
    );
});
