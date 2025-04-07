'use client';

import { safeUnreachable } from '@masknet/kit';
import type { HTMLProps } from 'react';

import PowerUserIcon from '@/assets/power-user.svg';
import VerifyIcon from '@/assets/verify.svg';
import { Image } from '@/components/Image.js';
import { Link } from '@/components/Link.js';
import { Source } from '@/constants/enum.js';
import { classNames } from '@/helpers/classNames.js';
import { useProfileVerifyBadge } from '@/hooks/useProfileVerifyBadge.js';
import { type Profile, ProfileBadgePresetColors } from '@/providers/types/SocialMedia.js';

interface Props extends HTMLProps<HTMLDivElement> {
    profile: Profile;
}

const presetColors: Record<string, string> = {
    [ProfileBadgePresetColors.TwitterGray]: 'text-twitterVerified',
    [ProfileBadgePresetColors.TwitterBlue]: 'text-twitterBlue',
    [ProfileBadgePresetColors.TwitterGold]: 'text-twitterVerifiedGold',
};

export function ProfileVerifyBadge({ profile, className }: Props) {
    const { data: icons = [] } = useProfileVerifyBadge(profile);
    if (!icons.length) return null;

    return (
        <div className={className}>
            {icons.map((icon, i) => {
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
                        return <PowerUserIcon key={i} className="size-4 shrink-0" width={16} height={16} />;
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
