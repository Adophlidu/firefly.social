import { Path, Svg } from 'react-native-svg';

import { type SvgIconProps } from '@/types/ui';

export function EditIcon({ stroke = '#222222', ...props }: SvgIconProps) {
    return (
        <Svg width="16" height="16" viewBox="0 0 16 16" fill="none" {...props}>
            <Path
                d="M8.83958 2.4L3.36624 8.19334C3.15958 8.41334 2.95958 8.84667 2.91958 9.14667L2.67291 11.3067C2.58624 12.0867 3.14624 12.62 3.91958 12.4867L6.06624 12.12C6.36624 12.0667 6.78624 11.8467 6.99291 11.62L12.4662 5.82667C13.4129 4.82667 13.8396 3.68667 12.3662 2.29334C10.8996 0.913335 9.78624 1.4 8.83958 2.4Z"
                stroke={stroke}
                strokeMiterlimit="10"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <Path
                d="M7.92676 3.36664C8.21342 5.20664 9.70676 6.6133 11.5601 6.79997"
                stroke={stroke}
                strokeMiterlimit="10"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <Path
                d="M2 14.6667H14"
                stroke={stroke}
                strokeMiterlimit="10"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    );
}
