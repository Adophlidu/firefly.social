'use client';

import { useEffect } from 'react';

import { isSameFireflyIdentity } from '@/helpers/isSameFireflyIdentity.js';
import { updateCurrentVisitingProfile } from '@/hooks/useCurrentVisitingProfile.js';
import type { FireflyIdentity, WalletProfile } from '@/providers/types/Firefly.js';
import type { Profile } from '@/providers/types/SocialMedia.js';
import { useFireflyIdentityState } from '@/store/useFireflyIdentityStore.js';

interface ProfileDetailEffectProps {
    identity: FireflyIdentity;
    profile?: Profile | null;
    walletProfile?: WalletProfile | null;
}

export function ProfileDetailEffect({ identity, profile, walletProfile }: ProfileDetailEffectProps) {
    useEffect(() => {
        if (profile) updateCurrentVisitingProfile(profile);

        const state = useFireflyIdentityState.getState();
        if (!isSameFireflyIdentity(state.identity, identity)) state.setIdentity(identity);

        state.setProfile(profile ?? null);
        state.setWalletProfile(walletProfile ?? null);
    }, [identity, profile, walletProfile]);

    return null;
}
