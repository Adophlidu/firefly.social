import BskyIcon from '@dimensiondev/assets/bsky-circle.svg';
import BskyFillIcon from '@dimensiondev/assets/bsky-fill.svg';
import BskySquareIcon from '@dimensiondev/assets/bsky-square.svg';
import FarcasterIcon from '@dimensiondev/assets/farcaster.svg';
import FarcasterFillIcon from '@dimensiondev/assets/farcaster-fill.svg';
import FarcasterSquareIcon from '@dimensiondev/assets/farcaster-square.svg';
import LensIcon from '@dimensiondev/assets/lens.svg';
import ColorfulLensIcon from '@dimensiondev/assets/lens-circle-small.svg';
import LensFillIcon from '@dimensiondev/assets/lens-fill.svg';
import LensSquareIcon from '@dimensiondev/assets/lens-square.svg';
import XFillIcon from '@dimensiondev/assets/x-fill.svg';
import { memo } from 'react';

import { XIcon } from '@/components/XIcon.js';
import { type SocialSource, Source } from '@/constants/enum.js';
import { useSizeStyle } from '@/hooks/useSizeStyle.js';

interface SocialSourceIconProps extends React.SVGAttributes<SVGElement> {
    size?: number;
    source: SocialSource;
    colorful?: boolean; // If true, use colorful Lens icon
    /** Monochrome */
    mono?: boolean;
    square?: boolean;
    isDark?: boolean;
}

const ColorIconMap = {
    [Source.Lens]: LensIcon,
    [Source.Farcaster]: FarcasterIcon,
    [Source.Twitter]: XIcon,
    [Source.Bsky]: BskyIcon,
} as const;
const MonochromeIconMap = {
    [Source.Lens]: LensFillIcon,
    [Source.Farcaster]: FarcasterFillIcon,
    [Source.Twitter]: XFillIcon,
    [Source.Bsky]: BskyFillIcon,
} as const;

const SquareIconMap = {
    [Source.Lens]: LensSquareIcon,
    [Source.Farcaster]: FarcasterSquareIcon,
    [Source.Twitter]: XIcon,
    [Source.Bsky]: BskySquareIcon,
} as const;

const ColorfulIconMap = {
    [Source.Lens]: (props: React.SVGAttributes<SVGElement>) => (
        <ColorfulLensIcon className="text-[#00B641]" {...props} />
    ),
    [Source.Farcaster]: FarcasterIcon,
    [Source.Twitter]: XIcon,
    [Source.Bsky]: BskyIcon,
} as const;
const ColorfulMonoIconMap = {
    [Source.Lens]: (props: React.SVGAttributes<SVGElement>) => (
        <ColorfulLensIcon className="text-transparent [--lens-face-color:white]" {...props} />
    ),
    [Source.Farcaster]: FarcasterFillIcon,
    [Source.Twitter]: XFillIcon,
    [Source.Bsky]: BskyFillIcon,
};

export const SocialSourceIcon = memo(function SocialSourceIcon({
    source,
    size = 20,
    mono,
    square,
    isDark,
    colorful,
    ...props
}: SocialSourceIconProps) {
    const style = useSizeStyle(size, props.style);
    const map = square
        ? SquareIconMap
        : mono
          ? colorful
              ? ColorfulMonoIconMap
              : MonochromeIconMap
          : colorful
            ? ColorfulIconMap
            : ColorIconMap;
    const Icon = map[source];

    if (!Icon) return null;
    return <Icon {...props} style={style} width={size} height={size} isDark={isDark} square={square} />;
});
