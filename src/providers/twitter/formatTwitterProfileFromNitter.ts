import { compact } from 'lodash-es';
import urlcat from 'urlcat';

import { Source } from '@/constants/enum.js';
import { SITE_URL } from '@/constants/index.js';
import { createDummyProfile } from '@/helpers/createDummyProfile.js';
import { getProfileUrl } from '@/helpers/getProfileUrl.js';
import { parseHtml } from '@/helpers/parseHtml.js';
import { parsePostUrl } from '@/helpers/parsePostUrl.js';
import { resolvePostUrl } from '@/helpers/resolvePostUrl.js';
import { getTwitterNitterPicUrl } from '@/providers/twitter/getTwitterNitterPicUrl.js';
import type { FireflyIdentity } from '@/providers/types/Firefly.js';
import { type User, UserVerifiedType } from '@/providers/types/Nitter.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

function parseBio(text: string) {
    const document = parseHtml(`<div>${text}</div>`);
    const anchorElements = document.querySelectorAll('a');
    for (const anchorElement of anchorElements) {
        if (anchorElement.innerText.startsWith('#')) continue;
        if (anchorElement.innerText.startsWith('$')) continue;
        if (anchorElement.innerText.startsWith('@')) continue;
        if (anchorElement.innerText.startsWith('＃')) {
            anchorElement.innerHTML = `#${anchorElement.innerHTML.slice(1)}`;
            continue;
        }
        const parsedPostUrl = parsePostUrl(anchorElement.href);
        if (parsedPostUrl) {
            anchorElement.innerHTML = urlcat(SITE_URL, resolvePostUrl(parsedPostUrl.source, parsedPostUrl.id));
            continue;
        }
        const parsedProfileUrl = parsePostUrl(anchorElement.href);
        if (parsedProfileUrl) {
            anchorElement.innerHTML = urlcat(
                SITE_URL,
                getProfileUrl({
                    source: parsedProfileUrl.source,
                    profileId: parsedProfileUrl.id,
                    handle: parsedProfileUrl.id,
                }),
            );
            continue;
        }
        anchorElement.innerHTML = anchorElement.href;
    }

    // `document.body.textContent` or `document.textContent` is not working
    return document.children[0].textContent;
}

function parseBioMentions(text: string): FireflyIdentity[] {
    const document = parseHtml(`<div>${text}</div>`);
    const anchorElements = document.querySelectorAll('a');
    return compact(
        [...anchorElements].map((el) => {
            if (el.innerText.startsWith('@')) {
                const handle = el.innerText.slice(1);
                return { id: handle, source: Source.Twitter };
            }
            return null;
        }),
    );
}

export function formatTwitterProfileFromNitter(user: User): Profile {
    return {
        ...createDummyProfile(Source.Twitter),
        profileId: user.id ?? user.username,
        handle: user.username,
        fullHandle: user.username,
        displayName: user.fullname,
        pfp: getTwitterNitterPicUrl(user.userPic),
        bio: parseBio(user.bio) ?? '',
        bioContext: {
            mentions: parseBioMentions(user.bio) ?? [],
        },
        followerCount: user.followers,
        followingCount: user.following,
        verified: user.verifiedType !== UserVerifiedType.None,
        protected: user.protected,
        website: user.website,
        location: user.location,
    };
}
