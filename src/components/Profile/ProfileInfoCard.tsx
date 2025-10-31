import { classNames } from '@firefly/utils';

import { ProfileInfo } from '@/components/Profile/ProfileInfo.js';
import { WalletMixInfo } from '@/components/Profile/WalletMixInfo.js';
import { type ProfilePageSource, Source } from '@/constants/enum.js';
import type { FireflyProfile, WalletProfile } from '@/providers/types/Firefly.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

interface Props {
    walletProfile?: WalletProfile | null;
    socialProfile?: Profile | null;
    source: ProfilePageSource;
    profiles?: FireflyProfile[];
}

export function ProfileInfoCard({ walletProfile, socialProfile, source, profiles }: Props) {
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
                <WalletMixInfo profiles={profiles} />
            ) : (
                <ProfileInfo walletProfile={walletProfile} socialProfile={socialProfile} />
            )}
        </div>
    );
}
