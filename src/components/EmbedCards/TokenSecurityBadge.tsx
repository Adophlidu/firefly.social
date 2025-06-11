import { compact } from 'lodash-es';
import { memo } from 'react';

import DangerIcon from '@/assets/danger.svg';
import WarningIcon from '@/assets/warning.svg';
import { TokenSecurityTippy } from '@/components/TokenProfile/TokenSecurityTippy.js';
import { type AddressSecurity, SecurityMessageLevel, type TokenContractSecurity } from '@/providers/types/Security.js';

interface SecurityBadgeProps {
    security?: TokenContractSecurity | AddressSecurity;
}

export const SecurityBadge = memo<SecurityBadgeProps>(function SecurityBadge({ security }) {
    if (!security) return null;

    const { warn_item_quantity: attentionFactors = 0, risk_item_quantity: riskyFactors = 0 } = security;
    if (!attentionFactors && !riskyFactors) return null;

    const levels = compact([
        riskyFactors ? SecurityMessageLevel.High : null,
        attentionFactors ? SecurityMessageLevel.Medium : null,
    ]);

    return (
        <TokenSecurityTippy security={security} level={levels}>
            <div className="flex items-center">
                {riskyFactors ? (
                    <DangerIcon width={16} height={16} className="shrink-0" />
                ) : attentionFactors ? (
                    <WarningIcon width={16} height={16} className="shrink-0" />
                ) : null}
            </div>
        </TokenSecurityTippy>
    );
});
