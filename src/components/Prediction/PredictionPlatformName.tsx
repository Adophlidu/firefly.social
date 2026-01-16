import { safeUnreachable } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';

import { BetsPlatform } from '@/constants/enum.js';

interface PredictionPlatformNameProps {
    platform: BetsPlatform;
}

export function PredictionPlatformName({ platform }: PredictionPlatformNameProps) {
    switch (platform) {
        case BetsPlatform.Polymarket:
            return <Trans>Polymarket</Trans>;
        case BetsPlatform.Opinion:
            return <Trans>Opinion</Trans>;
        default:
            safeUnreachable(platform);
            return null;
    }
}
