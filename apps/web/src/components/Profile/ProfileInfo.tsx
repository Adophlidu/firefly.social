import { SocialProfileInfo } from '@/components/Profile/SocialProfileInfo.js';
import { WalletInfo } from '@/components/Profile/WalletInfo.js';
import type { WalletProfile } from '@/providers/types/Firefly.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

interface Props {
    walletProfile?: WalletProfile | null;
    socialProfile?: Profile | null;
}

export async function ProfileInfo({ walletProfile, socialProfile }: Props) {
    if (walletProfile) return <WalletInfo profile={walletProfile} />;
    if (socialProfile) return <SocialProfileInfo profile={socialProfile} />;
    return null;
}
