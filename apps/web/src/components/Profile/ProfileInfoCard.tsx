'use client';

import type { ProfilePageSource } from '@dimensiondev/enums';
import { Source } from '@dimensiondev/enums';
import { classNames } from '@dimensiondev/utils';
import { useContext } from 'react';

import { ProfileContext } from '@/components/Profile/ProfileContext.js';
import { SocialProfileInfo } from '@/components/Profile/SocialProfileInfo.js';
import { WalletInfo } from '@/components/Profile/WalletInfo.js';
import { WalletMixInfo } from '@/components/Profile/WalletMixInfo.js';
import type { WalletProfile } from '@/providers/types/Firefly.js';

interface Props {
    walletProfile?: WalletProfile | null;
    source: ProfilePageSource;
    hasFireflyAccount?: boolean;
}

export function ProfileInfoCard({ walletProfile, source, hasFireflyAccount }: Props) {
    const { refreshedSocialProfile: socialProfile, profiles } = useContext(ProfileContext);

    return (
        <div
            className={classNames('relative z-30 mx-4 mb-2 rounded-lg', {
                'bg-farcasterBg': source === Source.Farcaster,
                'bg-lensBg': source === Source.Lens,
                'bg-xBg': source === Source.Twitter,
                'bg-bskyBg': source === Source.Bsky,
                'bg-walletBg': source === Source.WalletMix || (source === Source.Wallet && !walletProfile?.hacked),
                'bg-dangerBg': source === Source.Wallet && !!walletProfile?.hacked,
            })}
        >
            {profiles && source === Source.WalletMix ? (
                <WalletMixInfo profiles={profiles} hasFireflyAccount={hasFireflyAccount} />
            ) : walletProfile ? (
                <WalletInfo profile={walletProfile} />
            ) : socialProfile ? (
                <SocialProfileInfo profile={socialProfile} />
            ) : null}
        </div>
    );
}
