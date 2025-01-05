'use client';

import FarcasterIcon from '@/assets/farcaster.svg';
import FarcasterFillIcon from '@/assets/farcaster-fill.svg';
import LensIcon from '@/assets/lens.svg';
import LensFillIcon from '@/assets/lens-fill.svg';
import XFillIcon from '@/assets/x-fill.svg';
import { XIcon } from '@/components/XIcon.js';
import { type SocialSource, Source } from '@/constants/enum.js';
import { useSizeStyle } from '@/hooks/useSizeStyle.js';

interface SocialSourceIconProps extends React.SVGAttributes<SVGElement> {
    size?: number;
    source: SocialSource;
    /** Monochrome */
    mono?: boolean;
}

const ColorIconMap = {
    [Source.Lens]: LensIcon,
    [Source.Farcaster]: FarcasterIcon,
    [Source.Twitter]: XIcon,
} as const;
const MonochromeIconMap = {
    [Source.Lens]: LensFillIcon,
    [Source.Farcaster]: FarcasterFillIcon,
    [Source.Twitter]: XFillIcon,
} as const;

export function SocialSourceIcon({ source, size = 20, mono, ...props }: SocialSourceIconProps) {
    const style = useSizeStyle(size, props.style);
    const map = mono ? MonochromeIconMap : ColorIconMap;
    const Icon = map[source];

    if (!Icon) return null;
    return <Icon {...props} style={style} width={size} height={size} />;
}
