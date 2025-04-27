'use client';

import { Trans } from '@lingui/react/macro';

import { NotLoginFallback } from '@/components/NotLoginFallback.js';
import { Source } from '@/constants/enum.js';
import { redirect, useSearchParams } from '@/esm/navigation.js';
import { getProfileUrl } from '@/helpers/getProfileUrl.js';
import { isSocialSource } from '@/helpers/isSource.js';
import { resolveSourceFromUrl } from '@/helpers/resolveSource.js';
import { useCurrentFireflyProfilesAll } from '@/hooks/useCurrentFireflyProfiles.js';

export function FireflyLoginFallback() {
    const profileAll = useCurrentFireflyProfilesAll();
    const searchParam = useSearchParams();
    const rawSource = searchParam.get('source') || '';
    const source = resolveSourceFromUrl(rawSource);

    if (profileAll.length > 0) {
        const profile = profileAll.find((x) => x.identity.source === source) || profileAll[0];
        if (isSocialSource(profile.identity.source)) {
            redirect(
                getProfileUrl({
                    source: profile.identity.source,
                    profileId: profile.identity.id,
                    handle: profile.displayName,
                }),
            );
        }
    }

    return (
        <div className="flex w-full flex-col items-center">
            <div className="sticky top-[54px] z-20 flex w-full flex-col bg-primaryBottom md:top-0">
                <div className="flex h-[60px] w-full items-center px-4 pt-2.5 max-md:hidden">
                    <h1 className="text-[20px] font-bold leading-6">
                        <Trans>Profile</Trans>
                    </h1>
                </div>
            </div>
            <NotLoginFallback source={Source.Posts} className="!pt-[100px]" />
        </div>
    );
}
