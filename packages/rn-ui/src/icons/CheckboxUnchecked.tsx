import { Path, Svg } from 'react-native-svg';
import { useTheme } from 'tamagui';

import type { SvgIconProps } from '@/types/ui';

export function CheckboxUnchecked({ stroke, ...rest }: SvgIconProps) {
    const theme = useTheme();
    const finalStroke = stroke ?? theme.textTertiary!.get();
    return (
        <Svg width="16" height="16" viewBox="0 0 16 16" fill="none" {...rest}>
            <Path
                d="M1.33 4.93C1.33 2.73 2.73 1.33 4.93 1.33H11.06C13.27 1.33 14.67 2.73 14.67 4.93V11.07C14.67 13.27 13.27 14.67 11.07 14.67H4.93C2.73 14.67 1.33 13.27 1.33 11.07V4.93Z"
                stroke={finalStroke}
                strokeWidth="1.5"
            />
        </Svg>
    );
}
