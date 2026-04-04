import LimoIconLight from '@dimensiondev/assets/limo.svg';
import LimoIconDark from '@dimensiondev/assets/limo-dark.svg';
import { type SVGProps } from 'react';

import { useIsDarkMode } from '@/hooks/useIsDarkMode.js';

interface LimoIconProps extends SVGProps<SVGSVGElement> {}

export function LimoIcon(props: LimoIconProps) {
    const isDark = useIsDarkMode();

    return isDark ? <LimoIconDark {...props} /> : <LimoIconLight {...props} />;
}
