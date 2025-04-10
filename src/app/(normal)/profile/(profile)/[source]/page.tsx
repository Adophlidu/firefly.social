'use client';

import { use, useEffect } from 'react';

import { Link } from '@/components/Link.js';
import { NotLoginFallback } from '@/components/NotLoginFallback.js';
import { type ProfileCategory, Source, SourceInURL } from '@/constants/enum.js';
import { SORTED_PROFILE_SOURCES } from '@/constants/index.js';
import { notFound, redirect, RedirectType } from '@/esm/navigation.js';
import { classNames } from '@/helpers/classNames.js';
import { isSocialSource } from '@/helpers/isSource.js';
import { resolveFireflyIdentity } from '@/helpers/resolveFireflyProfileId.js';
import { resolveProfileUrl } from '@/helpers/resolveProfileUrl.js';
import { resolveSourceFromUrl } from '@/helpers/resolveSource.js';
import { resolveSourceName } from '@/helpers/resolveSourceName.js';
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

    return (
        <>
            <div className="no-scrollbar w-full overflow-x-auto overflow-y-hidden border-b border-line bg-primaryBottom px-4 md:top-0">
                <nav className="flex space-x-4 text-xl" aria-label="Tabs">
                    {SORTED_PROFILE_SOURCES.filter((source) => source !== Source.Wallet).map((value) => {
                        return (
                            <Link
                                key={value}
                                href={resolveProfileUrl(value)}
                                className={classNames(
                                    'h-[43px] cursor-pointer border-b-2 px-4 text-center font-bold leading-[43px] hover:text-main md:h-[60px] md:py-[18px] md:leading-6',
                                    value === source
                                        ? 'border-farcasterPrimary text-main'
                                        : 'border-transparent text-third',
                                )}
                                aria-current={value === source ? 'page' : undefined}
                            >
                                {resolveSourceName(value)}
                            </Link>
                        );
                    })}
                </nav>
            </div>
            <NotLoginFallback source={source} />
        </>
    );
}
