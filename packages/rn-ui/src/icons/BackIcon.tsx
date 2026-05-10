import { Path, Svg } from 'react-native-svg';
import { useTheme } from 'tamagui';

import type { SvgIconProps } from '@/types/ui';

export function BackIcon({ stroke, ...props }: SvgIconProps) {
    const theme = useTheme();
    const finalStroke = stroke ?? theme.text!.get();
    return (
        <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" {...props}>
            <Path
                d="M14.9998 19.92L8.47984 13.4C7.70984 12.63 7.70984 11.37 8.47984 10.6L14.9998 4.08"
                stroke={finalStroke}
                strokeWidth="1.5"
                strokeMiterlimit="10"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    );
}
