'use client';

import { Source } from '@dimensiondev/enums';
import { Trans } from '@lingui/react/macro';

import { NavigatorBar } from '@/components/NavigatorBar/index.js';
import { NotLoginFallback } from '@/components/NotLoginFallback.js';
import { TimelineTitle } from '@/components/TimelineTitle.js';
import { redirect, useSearchParams } from '@/esm/navigation.js';
import { getProfileUrl } from '@/helpers/getProfileUrl.js';
import { isSocialSource } from '@/helpers/isSource.js';
import { resolveSourceFromUrl } from '@/helpers/resolveSource.js';
import { useCurrentFireflyProfilesAll } from '@/hooks/useCurrentFireflyProfiles.js';

export function FireflyLoginFallback() {
    const profileAll = useCurrentFireflyProfilesAll();
    const searchParam = useSearchParams();
    const source = resolveSourceFromUrl(searchParam.get('source') || '');

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
                <TimelineTitle title={<Trans>Profile</Trans>} />
            </div>
            <NavigatorBar />
            <NotLoginFallback source={Source.Posts} className="!pt-[100px]" />
        </div>
    );
}
