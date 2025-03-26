import { ProfileInfo } from '@/components/Profile/ProfileInfo.js';
import { type ProfilePageSource, Source } from '@/constants/enum.js';
import { classNames } from '@/helpers/classNames.js';
import type { WalletProfile } from '@/providers/types/Firefly.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

interface Props {
    walletProfile?: WalletProfile;
    socialProfile?: Profile;
    source: ProfilePageSource;
}

export function ProfileInfoCard({ walletProfile, socialProfile, source }: Props) {
    return (
        <div
            className={classNames('relative z-20 mx-4 mb-2 rounded-lg', {
                'bg-farcasterBg': source === Source.Farcaster,
                'bg-lensBg': source === Source.Lens,
                'bg-xBg': source === Source.Twitter,
                'bg-bskyBg': source === Source.Bsky,
                'bg-walletBg': source === Source.Wallet && !walletProfile?.hacked,
                'bg-dangerBg': source === Source.Wallet && !!walletProfile?.hacked,
            })}
        >
            <ProfileInfo walletProfile={walletProfile} socialProfile={socialProfile} />
        </div>
    );
}
