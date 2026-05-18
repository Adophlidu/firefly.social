'use client';

import { Source } from '@dimensiondev/enums';
import PolymarketSquare from '@dimensiondev/assets/polymarket-square.svg';
import PolymarketSquareWhite from '@dimensiondev/assets/polymarket-square-white.svg';
import VerifyIcon from '@dimensiondev/assets/verify.svg';
import { classNames, safeUnreachable } from '@dimensiondev/utils';
import type { HTMLProps } from 'react';

import { Image } from '@/components/Image.js';
import { Link } from '@/components/Link.js';

import { useProfileVerifyBadge } from '@/hooks/useProfileVerifyBadge.js';
import { type Profile, ProfileBadgePresetColors } from '@/providers/types/SocialMedia.js';

interface Props extends HTMLProps<HTMLDivElement> {
    profile: Profile;
}

enum PolymarketBadgeDescription {
    Polymarket = 'Polymarket',
    PolymarketTraders = 'Polymarket Traders',
}

const presetColors: Record<string, string> = {
    [ProfileBadgePresetColors.TwitterGray]: 'text-twitterVerified',
    [ProfileBadgePresetColors.TwitterBlue]: 'text-twitterBlue',
    [ProfileBadgePresetColors.TwitterGold]: 'text-twitterVerifiedGold',
};

export function ProfileVerifyBadge({ profile, className }: Props) {
    const { data: icons = [] } = useProfileVerifyBadge(profile);
    if (profile.isProUser) {
        return (
            <div className={className}>
                <VerifyIcon
                    className={classNames('size-4 shrink-0', {
                        'text-[#FB3E5D]': profile.source === Source.Lens,
                        'text-[#855DCD]': profile.source === Source.Farcaster,
                    })}
                    width={16}
                    height={16}
                />
            </div>
        );
    }
    if (!icons.length) return null;

    return (
        <div className={className}>
            {icons.map((icon, i) => {
                if (icon.description === PolymarketBadgeDescription.PolymarketTraders) {
                    return <PolymarketSquareWhite key={i} className="size-4 shrink-0" width={16} height={16} />;
                }
                if (icon.description === PolymarketBadgeDescription.Polymarket) {
                    return <PolymarketSquare key={i} className="size-4 shrink-0" width={16} height={16} />;
                }
                if (icon.icon) {
                    const iconEl = (
                        <Image
                            key={i}
                            src={icon.icon}
                            className="size-4 shrink-0 rounded-sm"
                            alt={icon.source}
                            width={16}
                            height={16}
                        />
                    );
                    return icon.href ? (
                        <Link key={i} href={icon.href}>
                            {iconEl}
                        </Link>
                    ) : (
                        iconEl
                    );
                }

                switch (icon.source) {
                    case Source.Farcaster:
                        return <VerifyIcon key={i} className="size-4 shrink-0 text-[#855DCD]" width={16} height={16} />;
                    case Source.Lens:
                        return null;
                    case Source.Twitter:
                        const color = (icon.color ? presetColors[icon.color] : undefined) ?? 'text-twitterVerified';
                        return <VerifyIcon key={i} className={classNames('size-4 shrink-0', color)} />;
                    case Source.Bsky:
                        return null;
                    default:
                        safeUnreachable(icon.source);
                        return null;
                }
            })}
        </div>
    );
}
