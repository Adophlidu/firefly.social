import { uniqBy } from 'lodash-es';
import { notFound } from 'next/navigation.js';

import { ProfilePageLayout } from '@/app/(normal)/profile/pages/ProfilePageLayout.js';
import { NotLoginFallback } from '@/components/NotLoginFallback.js';
import { ProfileSourceTabs } from '@/components/Profile/ProfileSourceTabs.js';
import { type LoginFallbackSource, SourceInURL } from '@/constants/enum.js';
import { EMPTY_LIST, REQUIRE_LOGIN_SOURCES } from '@/constants/index.js';
import { isBotRequest } from '@/helpers/isBotRequest.js';
import { isProfilePageSource } from '@/helpers/isProfilePageSource.js';
import { isSocialSource } from '@/helpers/isSocialSource.js';
import { resolveSessionHolder } from '@/helpers/resolveSessionHolder.js';
import { resolveSourceFromUrlNoFallback } from '@/helpers/resolveSource.js';
import { resolveSpecialProfileIdentity } from '@/helpers/resolveSpecialProfileIdentity.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { setupServerTwitterSession } from '@/helpers/setupTwitterSession.js';
import { setupLocaleForSSR } from '@/i18n/index.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import type { NextPageProps } from '@/types/index.js';

interface Props extends NextPageProps<{ id: string; source: SourceInURL }> {}

export default async function Layout(props: Props) {
    if (await isBotRequest()) return null;

    await setupServerTwitterSession();
    await setupLocaleForSSR();

    const params = await props.params;
    const id = params.id;
    const source = resolveSourceFromUrlNoFallback(params.source);
    if (!source || !isProfilePageSource(source)) notFound();

    const identity = resolveSpecialProfileIdentity({ source, id });
    const profiles =
        (await runInSafeAsync(() => FireflyEndpointProvider.getAllPlatformProfileByIdentity(identity, false))) ??
        EMPTY_LIST;

    if (
        isSocialSource(source) &&
        REQUIRE_LOGIN_SOURCES.some((x) => x === source && !resolveSessionHolder(source).session)
    ) {
        return (
            <>
                <ProfileSourceTabs profiles={profiles} identity={identity} />
                <NotLoginFallback source={source as LoginFallbackSource} />
            </>
        );
    }

    return (
        <ProfilePageLayout
            identity={identity}
            profiles={uniqBy(profiles, (x) => `${x.identity.source}_${x.identity.id}`)}
        >
            {props.children}
        </ProfilePageLayout>
    );
}
