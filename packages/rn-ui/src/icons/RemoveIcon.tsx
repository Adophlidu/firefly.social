import { Path, Svg } from 'react-native-svg';
import { useTheme } from 'tamagui';

import type { SvgIconProps } from '@/types/ui';

export function RemoveIcon({ stroke, ...props }: SvgIconProps) {
    const theme = useTheme();
    const finalStroke = stroke ?? theme.text!.get();
    return (
        <Svg width="16" height="16" viewBox="0 0 16 16" fill="none" {...props}>
            <Path
                d="M14 3.98665C11.78 3.76665 9.54667 3.65332 7.32 3.65332C6 3.65332 4.68 3.71999 3.36 3.85332L2 3.98665"
                stroke={finalStroke}
                strokeOpacity="0.8"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <Path
                d="M5.66699 3.31331L5.81366 2.43998C5.92033 1.80665 6.00033 1.33331 7.12699 1.33331H8.87366C10.0003 1.33331 10.087 1.83331 10.187 2.44665L10.3337 3.31331"
                stroke={finalStroke}
                strokeOpacity="0.8"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <Path
                d="M12.5669 6.09332L12.1336 12.8067C12.0603 13.8533 12.0003 14.6667 10.1403 14.6667H5.86026C4.00026 14.6667 3.94026 13.8533 3.86693 12.8067L3.43359 6.09332"
                stroke={finalStroke}
                strokeOpacity="0.8"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <Path
                d="M6.88672 11H9.10672"
                stroke={finalStroke}
                strokeOpacity="0.8"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <Path
                d="M6.33301 8.33331H9.66634"
                stroke={finalStroke}
                strokeOpacity="0.8"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    );
}
