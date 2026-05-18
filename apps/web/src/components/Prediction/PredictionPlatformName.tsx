'use client';

import { PredictionPlatform } from '@dimensiondev/enums';
import { safeUnreachable } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';

interface PredictionPlatformNameProps {
    platform: PredictionPlatform;
}

export function PredictionPlatformName({ platform }: PredictionPlatformNameProps) {
    switch (platform) {
        case PredictionPlatform.Polymarket:
            return <Trans>Polymarket</Trans>;
        case PredictionPlatform.Opinion:
            return <Trans>Opinion</Trans>;
        default:
            safeUnreachable(platform);
            return null;
    }
}
