'use client';

import { type ReactNode, useEffect } from 'react';

import { PageRoute, type SocialSource } from '@/constants/enum.js';
import { redirect, RedirectType } from '@/esm/navigation.js';
import { getProfileUrl } from '@/helpers/getProfileUrl.js';
import { resolveFireflyIdentity } from '@/helpers/resolveFireflyProfileId.js';
import { useCurrentProfile } from '@/hooks/useCurrentProfile.js';
import { useFireflyIdentityState } from '@/store/useFireflyIdentityStore.js';
import { usePreferencesState } from '@/store/usePreferenceStore.js';

export function RedirectProfilePage({ source }: { source: SocialSource }): ReactNode | never {
    const currentProfile = useCurrentProfile(source);
    const profile = resolveFireflyIdentity(currentProfile);
    const { setIdentity } = useFireflyIdentityState();
    const { resetPreferences } = usePreferencesState();

    useEffect(() => {
        if (source) {
            setIdentity({
                source,
                id: profile?.id || '',
            });
            resetPreferences();
        }
    }, [source, profile?.id, setIdentity, resetPreferences]);

    // profile link should be shareable
    if (profile && currentProfile) {
        redirect(getProfileUrl(currentProfile), RedirectType.replace);
    }

    redirect(PageRoute.Profile, RedirectType.replace);
}
