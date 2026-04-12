import XIconDark from '@dimensiondev/assets/x-circle-dark.svg';
import XIconLight from '@dimensiondev/assets/x-circle-light.svg';
import XSquareDarkIcon from '@dimensiondev/assets/x-square-dark.svg';
import XSquareLightIcon from '@dimensiondev/assets/x-square-light.svg';
import type { SVGProps } from 'react';

import { useIsDarkMode } from '@/hooks/useIsDarkMode.js';

interface XIconProps extends SVGProps<SVGSVGElement> {
    square?: boolean;
    isDark?: boolean;
}

export function XIcon(props: XIconProps) {
    const isDarkMode = useIsDarkMode();
    const isDark = props.isDark ?? isDarkMode;
    const { isDark: _, square, ...svgProps } = props;
    const Icon = square ? (isDark ? XSquareDarkIcon : XSquareLightIcon) : isDark ? XIconDark : XIconLight;
    return <Icon {...svgProps} />;
}
