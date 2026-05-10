import { Path, Svg } from 'react-native-svg';
import { useTheme } from 'tamagui';

import type { SvgIconProps } from '@/types/ui';

export function SwitchIcon({ stroke, ...rest }: SvgIconProps) {
    const theme = useTheme();
    const finalStroke = stroke ?? theme.text!.get();
    return (
        <Svg width="14" height="14" viewBox="0 0 14 14" fill="none" {...rest}>
            <Path
                d="M10.08 6.09585L12.25 3.92583M12.25 3.92583L10.08 1.75584M12.25 3.92583H1.75M3.91998 7.90417L1.75 10.0742M1.75 10.0742L3.91998 12.2442M1.75 10.0742H12.25"
                stroke={finalStroke}
                strokeOpacity="0.4"
                strokeWidth="1.16667"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    );
}
