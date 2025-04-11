'use client';

import { use, useEffect } from 'react';

import { PageRoute, type ProfileCategory, SourceInURL } from '@/constants/enum.js';
import { notFound, redirect, RedirectType } from '@/esm/navigation.js';
import { isSocialSource } from '@/helpers/isSource.js';
import { resolveFireflyIdentity } from '@/helpers/resolveFireflyProfileId.js';
import { resolveProfileUrl } from '@/helpers/resolveProfileUrl.js';
import { resolveSourceFromUrl } from '@/helpers/resolveSource.js';
import { useCurrentProfile } from '@/hooks/useCurrentProfile.js';
import { useFireflyIdentityState } from '@/store/useFireflyIdentityStore.js';
import { usePreferencesState } from '@/store/usePreferenceStore.js';
import type { NextPageProps } from '@/types/index.js';

interface Props extends NextPageProps<{ id: string; category: ProfileCategory; source: SourceInURL }> {}

export default function Page(props: Props) {
    const params = use(props.params);
    const source = resolveSourceFromUrl(params.source);
    if (!isSocialSource(source)) notFound();

    const currentProfile = useCurrentProfile(source);
    const profile = resolveFireflyIdentity(currentProfile);

    useEffect(() => {
        if (source) {
            useFireflyIdentityState.getState().setIdentity({
                source,
                id: profile?.id || '',
            });
            usePreferencesState.getState().resetPreferences();
        }
    }, [source, profile?.id]);

    // profile link should be shareable
    if (profile) {
        redirect(resolveProfileUrl(source, profile.id), RedirectType.replace);
    }

    redirect(PageRoute.Profile, RedirectType.replace);
}
