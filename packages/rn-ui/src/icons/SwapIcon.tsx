import { Path, Svg } from 'react-native-svg';

import type { SvgIconProps } from '@/types/ui';

export function SwapIcon({ stroke = '#464646', ...props }: SvgIconProps) {
    return (
        <Svg width="16" height="16" viewBox="0 0 16 16" fill="none" {...props}>
            <Path
                d="M13.6671 9.99335L10.3271 13.34"
                stroke={stroke}
                strokeOpacity="0.4"
                strokeMiterlimit="10"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <Path
                d="M2.33301 9.99335H13.6663"
                stroke={stroke}
                strokeOpacity="0.4"
                strokeMiterlimit="10"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <Path
                d="M2.33301 6.00664L5.67301 2.65997"
                stroke={stroke}
                strokeOpacity="0.4"
                strokeMiterlimit="10"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <Path
                d="M13.6663 6.00665H2.33301"
                stroke={stroke}
                strokeOpacity="0.4"
                strokeMiterlimit="10"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    );
}
