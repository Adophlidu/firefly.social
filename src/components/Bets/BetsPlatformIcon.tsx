import { safeUnreachable } from '@dimensiondev/utils';

import OpinionIcon from '@/assets/opinion.svg';
import PolymarketIcon from '@/assets/polymarket.svg';
import { BetsPlatform } from '@/constants/enum.js';

interface BetsPlatformIconProps {
    platform: BetsPlatform;
    className?: string;
    size?: number;
}

export function BetsPlatformIcon({ platform, size = 15, className }: BetsPlatformIconProps) {
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
