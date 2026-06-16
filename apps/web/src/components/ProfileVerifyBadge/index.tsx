'use client';

import PolymarketSquare from '@dimensiondev/assets/polymarket-square.svg';
import PolymarketSquareWhite from '@dimensiondev/assets/polymarket-square-white.svg';
import VerifyIcon from '@dimensiondev/assets/verify.svg';
import { Source } from '@dimensiondev/enums';
import { classNames, safeUnreachable } from '@dimensiondev/utils';
import { type HTMLProps, useState } from 'react';

import { Image } from '@/components/Image.js';
import { Link } from '@/components/Link.js';
import { useProfileVerifyBadge } from '@/hooks/useProfileVerifyBadge.js';
import { type Profile, type ProfileBadge, ProfileBadgePresetColors } from '@/providers/types/SocialMedia.js';

interface Props extends HTMLProps<HTMLDivElement> {
    profile: Profile;
}

// Affiliate badge images come from cached X data that can point to a deleted avatar
// hash (404). Hide the whole badge on failure instead of showing a generic placeholder.
function AffiliateBadge({ icon }: { icon: ProfileBadge }) {
    const [failed, setFailed] = useState(false);
    if (failed || !icon.icon) return null;

    const iconEl = (
        <Image
            src={icon.icon}
            className="size-4 shrink-0 rounded-sm"
            alt={icon.source}
            width={16}
            height={16}
            fallback={false}
            onError={() => setFailed(true)}
        />
    );

    return icon.href ? <Link href={icon.href}>{iconEl}</Link> : iconEl;
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
                    return <AffiliateBadge key={i} icon={icon} />;
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
