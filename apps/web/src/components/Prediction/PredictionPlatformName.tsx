'use client';

import { safeUnreachable } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';

import { PredictionPlatform } from '@/constants/enum.js';

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
