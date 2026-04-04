import DangerIcon from '@dimensiondev/assets/danger.svg';
import WarningIcon from '@dimensiondev/assets/warning.svg';
import { compact } from 'lodash-es';
import { memo } from 'react';

import { TokenSecurityTippy } from '@/components/TokenProfile/TokenSecurityTippy.js';
import { type AddressSecurity, SecurityMessageLevel, type TokenContractSecurity } from '@/providers/types/Security.js';

interface SecurityBadgeProps {
    security?: TokenContractSecurity | AddressSecurity;
    interactive?: boolean;
}

export const SecurityBadge = memo<SecurityBadgeProps>(function SecurityBadge({ security, interactive }) {
    if (!security) return null;

    const { warn_item_quantity: attentionFactors = 0, risk_item_quantity: riskyFactors = 0 } = security;
    if (!attentionFactors && !riskyFactors) return null;

    const levels = compact([
        riskyFactors ? SecurityMessageLevel.High : null,
        attentionFactors ? SecurityMessageLevel.Medium : null,
    ]);

    return (
        <TokenSecurityTippy security={security} level={levels} interactive={interactive}>
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
