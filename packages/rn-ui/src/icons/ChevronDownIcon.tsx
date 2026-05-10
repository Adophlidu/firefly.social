import { Path, Svg } from 'react-native-svg';
import { useTheme } from 'tamagui';

import type { SvgIconProps } from '@/types/ui';

export function ChevronDownIcon({ stroke, ...props }: SvgIconProps) {
    const theme = useTheme();
    const finalStroke = stroke ?? theme.text!.get();
    return (
        <Svg width="11" height="6" viewBox="0 0 11 6" fill="none" {...props}>
            <Path
                d="M0.666992 0.666664L5.11144 5.11111L9.55588 0.666664"
                stroke={finalStroke}
                strokeOpacity="0.4"
                strokeWidth="1.33333"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    );
}
