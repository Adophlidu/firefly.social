'use client';

import { memo } from 'react';

import BskyIcon from '@/assets/bsky-circle.svg';
import BskyFillIcon from '@/assets/bsky-fill.svg';
import BskySquareIcon from '@/assets/bsky-square.svg';
import FarcasterIcon from '@/assets/farcaster.svg';
import FarcasterFillIcon from '@/assets/farcaster-fill.svg';
import FarcasterSquareIcon from '@/assets/farcaster-square.svg';
import LensIcon from '@/assets/lens.svg';
import ColorfulLensIcon from '@/assets/lens-circle-small.svg';
import LensFillIcon from '@/assets/lens-fill.svg';
import LensSquareIcon from '@/assets/lens-square.svg';
import XFillIcon from '@/assets/x-fill.svg';
import { XIcon } from '@/components/XIcon.js';
import { type SocialSource, Source } from '@/constants/enum.js';
import { useSizeStyle } from '@/hooks/useSizeStyle.js';

// --lens-face-color

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
    const isXIcon = Icon === XIcon;
    if (isXIcon) {
        return <Icon {...props} style={style} width={size} height={size} isDark={isDark} square={square} />;
    }
    return <Icon {...props} style={style} width={size} height={size} />;
});
