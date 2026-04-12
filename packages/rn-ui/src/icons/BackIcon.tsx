import { Path, Svg } from 'react-native-svg';

import type { SvgIconProps } from '@/types/ui';

export function BackIcon({ stroke = '#171717', ...props }: SvgIconProps) {
    return (
        <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" {...props}>
            <Path
                d="M14.9998 19.92L8.47984 13.4C7.70984 12.63 7.70984 11.37 8.47984 10.6L14.9998 4.08"
                stroke={stroke}
                strokeWidth="1.5"
                strokeMiterlimit="10"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    );
}
