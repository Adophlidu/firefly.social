import { safeUnreachable } from '@dimensiondev/utils';

import OpinionIcon from '@/assets/opinion.svg';
import PolymarketIcon from '@/assets/polymarket.svg';
import { BetsPlatform } from '@/constants/enum.js';

interface PredictionPlatformIconProps {
    platform: BetsPlatform;
    className?: string;
    size?: number;
}

export function PredictionPlatformIcon({ platform, size = 15, className }: PredictionPlatformIconProps) {
    switch (platform) {
        case BetsPlatform.Polymarket:
            return <PolymarketIcon width={size} height={size} className={className} />;
        case BetsPlatform.Opinion:
            return <OpinionIcon width={size} height={size} className={className} />;
        default:
            safeUnreachable(platform);
            return null;
    }
}
