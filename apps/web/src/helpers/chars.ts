import type { SocialSource } from '@dimensiondev/enums';
import { CharTag, SessionType, Source } from '@dimensiondev/enums';
import { safeUnreachable } from '@dimensiondev/utils';
import urlcat from 'urlcat';

import {
    MAX_CHAR_SIZE_PER_POST,
    MAX_CHAR_SIZE_PRO_PER_POST,
    MAX_CHAR_SIZE_VERIFY_PER_POST,
} from '@/constants/limitation.js';
import { getCurrentProfileFromStorage } from '@/helpers/getCurrentProfileFromStorage.js';
import { getProfileUrl } from '@/helpers/getProfileUrl.js';
import { getSessionFromStorage } from '@/helpers/getSessionFromStorage.js';
import { resolveSourceFromFireflyPlatform } from '@/helpers/resolveSource.js';
import { addSharerParam } from '@/helpers/sharerUrl.js';
import { resolveLengthCalculator } from '@/services/resolveLengthCalculator.js';
import type { Chars, PromoteLinkChars } from '@/types/chars.js';
import type { CompositePost } from '@/types/compose.js';

interface Options {
    chars: Chars;
    strategy?: 'both' | 'visible' | 'invisible';
    source?: SocialSource;
    keepPostLinks?: boolean;
}

export function readChars({ chars, strategy = 'both', source, keepPostLinks = false }: Options) {
    const list = (Array.isArray(chars) ? chars : [chars]).slice();

    const promoteLinkChars = list.find((x) => (typeof x === 'string' ? false : x.tag === CharTag.PROMOTE_LINK)) as
        | PromoteLinkChars
        | undefined;

    const promoteLink = promoteLinkChars?.content;
    const profile = source ? getCurrentProfileFromStorage(source) : null;
    const uid = getSessionFromStorage(SessionType.Firefly)?.payload?.uid;
    const specifiedUrl = profile ? addSharerParam(urlcat(location.origin, getProfileUrl(profile)), uid) : '';

    return list
        .sort((a, b) => {
            const aSortNo = typeof a === 'string' ? 0 : a.sortNo || 0;
            const bSortNo = typeof b === 'string' ? 0 : b.sortNo || 0;
            return aSortNo - bSortNo;
        })
        .map((x) => {
            if (typeof x === 'string') {
                if (strategy === 'invisible') return '';
                return x;
            }
            if (x.visible && strategy === 'invisible') return '';
            if (!x.visible && strategy === 'visible') return '';

            switch (x.tag) {
                case CharTag.FIREFLY_RP:
                    return `${x.content}\n`;
                case CharTag.MENTION:
                    if (source) {
                        const target = x.profiles.find(
                            (profile) => source === resolveSourceFromFireflyPlatform(profile.platform),
                        );
                        const hit = x.profiles.find((profile) => !!profile.hit);

                        return target?.handle
                            ? `${source === Source.Lens ? '@lens/' : '@'}${target.handle}`
                            : hit?.handle
                              ? `@${hit.handle}`
                              : x.content;
                    }
                    return x.content;
                case CharTag.FRAME:
                    return '';
                case CharTag.PROMOTE_LINK:
                    const result = `\n ${x.content}`;

                    return promoteLink && specifiedUrl ? result.replace(promoteLink, specifiedUrl) : result;
                case CharTag.POST_LINK:
                    if (source && x.source === source && !keepPostLinks) return '';
                    return `\n ${x.content}`;
                default:
                    safeUnreachable(x);
                    return '';
            }
        })
        .join('');
}

export function writeChars(chars: Chars, newChars: Chars) {
    const charsWrapped = Array.isArray(chars) ? chars : [chars];
    const newCharsWrapped = Array.isArray(newChars) ? newChars : [newChars];

    return [
        // discard visible chars, only keep invisible ones
        ...charsWrapped.filter((x) => (typeof x === 'string' ? false : !x.visible)),
        ...newCharsWrapped,
    ];
}

function resolvePeerPostMaxChars(source: SocialSource, post: CompositePost) {
    const profile = getCurrentProfileFromStorage(source);
    const currentMax = profile?.isProUser
        ? MAX_CHAR_SIZE_PRO_PER_POST[source]
        : profile?.verified
          ? MAX_CHAR_SIZE_VERIFY_PER_POST[source]
          : MAX_CHAR_SIZE_PER_POST[source];

    return post.poll
        ? Math.min(
              currentMax,
              source !== Source.Twitter
                  ? 255 + readChars({ chars: post.chars, strategy: 'invisible', source }).length
                  : currentMax,
          )
        : currentMax;
}

function resolveUsedLength(sources: SocialSource[], chars: Chars) {
    const profile = getCurrentProfileFromStorage(Source.Twitter);
    // X > Bluesky > Farcaster > X premium > Lens
    const sortedSources: SocialSource[] = profile?.verified
        ? [Source.Bsky, Source.Farcaster, Source.Twitter, Source.Lens]
        : [Source.Twitter, Source.Bsky, Source.Farcaster, Source.Lens];

    const firstAvailableSource = sortedSources.find((source) => sources.includes(source));

    if (!firstAvailableSource) return 0;

    return resolveLengthCalculator(firstAvailableSource)(
        readChars({ chars, strategy: 'visible', source: firstAvailableSource }),
    );
}

export function measureChars(post: CompositePost) {
    const { chars, availableSources } = post;

    if (!availableSources.length) return { usedLength: 0, availableLength: 0 };

    return {
        // X > Bluesky > Farcaster > X premium > Lens
        usedLength: resolveUsedLength(availableSources, chars),
        // min(limit_y1 - invisible, limit_y2 - invisible, limit_y3 - invisible)
        availableLength: Math.min(
            ...availableSources.map(
                (source) =>
                    resolvePeerPostMaxChars(source, post) -
                    resolveLengthCalculator(source)(readChars({ chars, strategy: 'invisible', source })),
            ),
        ),
    };
}
