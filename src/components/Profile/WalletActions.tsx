'use client';
import { HackedButton } from '@/components/Profile/HackedButton.js';
import { WalletMoreAction } from '@/components/Profile/WalletMoreAction.js';
import { WatchButton } from '@/components/Profile/WatchButton.js';
import { Source } from '@/constants/enum.js';
import { useIsMyRelatedProfile } from '@/hooks/useIsMyRelatedProfile.js';
import { useIsMedium } from '@/hooks/useMediaQuery.js';
import type { WalletProfile } from '@/providers/types/Firefly.js';

export function WalletActions({ profile }: { profile: WalletProfile }) {
    const isMyWallets = useIsMyRelatedProfile(Source.Wallet, profile.address);
    const isMedium = useIsMedium();

    if (isMyWallets || !isMedium) return null;

    if (profile.hacked) return <HackedButton className="ml-auto" />;

    return (
        <>
            <WatchButton className="ml-auto mr-1 !bg-lightHighlight" address={profile.address} />
            <WalletMoreAction profile={profile} />
        </>
    );
}
