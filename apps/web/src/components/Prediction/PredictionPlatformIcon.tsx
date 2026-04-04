import OpinionIcon from '@dimensiondev/assets/opinion.svg';
import PolymarketIcon from '@dimensiondev/assets/polymarket.svg';
import { safeUnreachable } from '@dimensiondev/utils';

import { PredictionPlatform } from '@/constants/enum.js';

interface PredictionPlatformIconProps {
    platform: PredictionPlatform;
    className?: string;
    size?: number;
}

export function PredictionPlatformIcon({ platform, size = 15, className }: PredictionPlatformIconProps) {
    switch (platform) {
        case PredictionPlatform.Polymarket:
            return <PolymarketIcon width={size} height={size} className={className} />;
        case PredictionPlatform.Opinion:
            return <OpinionIcon width={size} height={size} className={className} />;
        default:
            safeUnreachable(platform);
            return null;
    }
}
