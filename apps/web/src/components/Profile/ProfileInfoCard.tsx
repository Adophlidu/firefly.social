import type { ProfilePageSource } from '@dimensiondev/enums';
import { Source } from '@dimensiondev/enums';
import { classNames } from '@dimensiondev/utils';

import { ProfileInfo } from '@/components/Profile/ProfileInfo.js';
import { WalletMixInfo } from '@/components/Profile/WalletMixInfo.js';
import type { FireflyProfile, WalletProfile } from '@/providers/types/Firefly.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

interface Props {
    walletProfile?: WalletProfile | null;
    socialProfile?: Profile | null;
    source: ProfilePageSource;
    profiles?: FireflyProfile[];
    hasFireflyAccount?: boolean;
}

export function ProfileInfoCard({ walletProfile, socialProfile, source, profiles, hasFireflyAccount }: Props) {
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
            ) : (
                <ProfileInfo walletProfile={walletProfile} socialProfile={socialProfile} />
            )}
        </div>
    );
}
