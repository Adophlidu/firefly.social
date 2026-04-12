import { Path, Svg } from 'react-native-svg';

import type { SvgIconProps } from '@/types/ui';

export function HistoryIcon({ stroke = '#171717', ...props }: SvgIconProps) {
    return (
        <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" {...props}>
            <Path
                d="M3.5 8H20.5M21 14.7371V7.75C21 4.75 19.5 2.75 16 2.75H8C4.5 2.75 3 4.75 3 7.75V16.25C3 19.25 4.5 21.25 8 21.25H14.8467M19.9465 20L18.3507 18.9914V17M23 18.5C23 20.984 20.984 23 18.5 23C16.016 23 14 20.984 14 18.5C14 16.016 16.016 14 18.5 14C20.984 14 23 16.016 23 18.5Z"
                stroke={stroke}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    );
}
