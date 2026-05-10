import { Path, Svg } from 'react-native-svg';
import { useTheme } from 'tamagui';

import type { SvgIconProps } from '@/types/ui';

export function SolidArrowIcon({ stroke, ...props }: SvgIconProps) {
    const theme = useTheme();
    const finalStroke = stroke ?? theme.text!.get();
    return (
        <Svg width="14" height="14" viewBox="0 0 14 14" fill="none" {...props}>
            <Path
                d="M10.4534 4.77173H6.81926H3.54676C2.98676 4.77173 2.70676 5.4484 3.10343 5.84506L6.1251 8.86673C6.60926 9.3509 7.39676 9.3509 7.88093 8.86673L9.0301 7.71756L10.9026 5.84506C11.2934 5.4484 11.0134 4.77173 10.4534 4.77173Z"
                fill={finalStroke}
            />
        </Svg>
    );
}
