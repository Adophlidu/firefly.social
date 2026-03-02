'use client';

import { compact } from 'lodash-es';
import { useEffect } from 'react';

import { CharTag, FireflyPlatform } from '@/constants/enum.js';
import { EMPTY_LIST, SITE_URL_OFFICIAL } from '@/constants/static.js';
import { useRouter } from '@/esm/navigation.js';
import { formatSearchProfile } from '@/helpers/formatSearchProfile.js';
import { getCurrentProfileAllFromStorage } from '@/helpers/getCurrentProfileFromStorage.js';
import { openLoginModal } from '@/helpers/openLoginModal.js';
import { resolveSocialSourceFromFireflyPlatform } from '@/helpers/resolveSource.js';
import { trimify } from '@/helpers/trimify.js';
import { useIsLogin } from '@/hooks/useIsLogin.js';
import { ComposeModalRef } from '@/modals/ComposeModal/refs.js';
import { searchIdentity } from '@/providers/firefly/endpoint/searchIdentity.js';
import { type Profile } from '@/providers/types/Firefly.js';

export interface ShareLinkProps {
    text: string;
    url: string;
    via: string;
}

const fireflyMention = {
    tag: CharTag.MENTION,
    visible: true,
    content: `@thefireflyapp`,
    profiles: [
        {
            platform_id: '1583361564479889408',
            platform: FireflyPlatform.Twitter,
            handle: 'thefireflyapp',
            name: 'thefireflyapp',
            hit: true,
            score: 0,
        },
        {
            platform_id: '16823',
            platform: FireflyPlatform.Farcaster,
            handle: 'fireflyapp',
            name: 'Firefly App',
            hit: true,
            score: 0,
        },
        {
            platform_id: '0x01b000',
            platform: FireflyPlatform.Lens,
            handle: 'fireflyapp',
            name: 'fireflyapp',
            hit: true,
            score: 0,
        },
    ] satisfies Profile[],
};

async function searchIdentities(query: string) {
    const data = await searchIdentity(query);
    if (!data.data.length) return [];

    return compact(data.data.map((x) => formatSearchProfile(x)));
}

async function openCompose(props: ShareLinkProps, onFinished: () => void) {
    const query = trimify(props.via || '').replace(/^@/, '');
    const identities = query ? await searchIdentities(query) : [];

    const currentProfiles = getCurrentProfileAllFromStorage();
    const matchedIdentity = identities.find((x) => x.profile.handle === query);

    const isLogin = Object.values(currentProfiles).some((x) => !!x?.profileId);
    if (!isLogin) {
        openLoginModal(
            matchedIdentity
                ? { source: resolveSocialSourceFromFireflyPlatform(matchedIdentity.profile.platform) }
                : undefined,
        );
        return;
    }

    const expectedSources = matchedIdentity?.related
        .map((x) => resolveSocialSourceFromFireflyPlatform(x.platform))
        .filter((x) => !!currentProfiles[x]?.profileId);

    await ComposeModalRef.openAndWaitForClose({
        type: 'compose',
        source: expectedSources,
        chars: [
            `${props.text}\n`,
            `${props.url || SITE_URL_OFFICIAL} via `,
            query
                ? {
                      tag: CharTag.MENTION,
                      visible: true,
                      content: `@${query}`,
                      profiles: matchedIdentity?.related || EMPTY_LIST,
                  }
                : {
                      ...fireflyMention,
                      tag: CharTag.MENTION,
                  },
        ],
    });

    onFinished();
}

export function ShareLinkPage(props: ShareLinkProps) {
    const isLogin = useIsLogin();
    const router = useRouter();

    useEffect(() => {
        openCompose(props, () => router.replace('/'));
    }, [isLogin, props, router]);

    return null;
}
