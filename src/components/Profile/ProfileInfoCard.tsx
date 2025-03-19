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
            className={classNames('mx-4 mb-2 rounded-lg border bg-lightBg', {
                'border-farcasterPrimary shadow-farcasterCard': source === Source.Farcaster,
                'border-lensPrimary shadow-lensCard': source === Source.Lens,
                'border-primaryBottom shadow-xCard': source === Source.Twitter,
                'border-bskyPrimary shadow-bskyCard': source === Source.Bsky,
                'border-lightHighlight shadow-lightHighlightCard': source === Source.Wallet && !walletProfile?.hacked,
                'border-danger shadow-dangerCard': source === Source.Wallet && !!walletProfile?.hacked,
            })}
        >
            <ProfileInfo walletProfile={walletProfile} socialProfile={socialProfile} />
        </div>
    );
}
