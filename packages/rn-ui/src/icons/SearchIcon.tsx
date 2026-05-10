import { Path, Svg } from 'react-native-svg';
import { useTheme } from 'tamagui';

import type { SvgIconProps } from '@/types/ui';

export function SearchIcon({ stroke, ...props }: SvgIconProps) {
    const theme = useTheme();
    const finalStroke = stroke ?? theme.text!.get();
    return (
        <Svg width="16" height="16" viewBox="0 0 16 16" fill="none" {...props}>
            <Path
                d="M7.66683 13.9999C11.1646 13.9999 14.0002 11.1644 14.0002 7.66659C14.0002 4.16878 11.1646 1.33325 7.66683 1.33325C4.16903 1.33325 1.3335 4.16878 1.3335 7.66659C1.3335 11.1644 4.16903 13.9999 7.66683 13.9999Z"
                stroke={finalStroke}
                strokeWidth="1.33333"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <Path
                d="M14.6668 14.6666L13.3335 13.3333"
                stroke={finalStroke}
                strokeWidth="1.33333"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    );
}
