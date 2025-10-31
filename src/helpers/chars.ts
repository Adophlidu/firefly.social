import { safeUnreachable } from '@firefly/utils';
import urlcat from 'urlcat';

import { CharTag, type SocialSource, Source } from '@/constants/enum.js';
import {
    MAX_CHAR_SIZE_PER_POST,
    MAX_CHAR_SIZE_PRO_PER_POST,
    MAX_CHAR_SIZE_VERIFY_PER_POST,
} from '@/constants/limitation.js';
import { getProfileFromStorage } from '@/helpers/getProfileFromStorage.js';
import { getProfileState } from '@/helpers/getProfileState.js';
import { getProfileUrl } from '@/helpers/getProfileUrl.js';
import { resolveSourceFromFireflyPlatform } from '@/helpers/resolveSource.js';
import { resolveLengthCalculator } from '@/services/resolveLengthCalculator.js';
import type { CompositePost } from '@/store/useComposeStore.js';
import type { Chars, PromoteLinkChars } from '@/types/chars.js';

/**
 * Stringify chars into plain text
 * @param chars
 * @param visibleOnly
 * @returns
 */
export function readChars(chars: Chars, strategy: 'both' | 'visible' | 'invisible' = 'both', source?: SocialSource) {
    const list = (Array.isArray(chars) ? chars : [chars]).slice();

    const promoteLinkChars = list.find((x) => (typeof x === 'string' ? false : x.tag === CharTag.PROMOTE_LINK)) as
        | PromoteLinkChars
        | undefined;

    const promoteLink = promoteLinkChars?.content;
    const profile = source ? getProfileFromStorage(source) : null;
    const specifiedUrl = profile ? urlcat(location.origin, getProfileUrl(profile)) : '';

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
                    if (source && x.source === source) return '';
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
    const profile = getProfileState(source).currentProfile;
    const currentMax = profile?.isProUser
        ? MAX_CHAR_SIZE_PRO_PER_POST[source]
        : profile?.verified
          ? MAX_CHAR_SIZE_VERIFY_PER_POST[source]
          : MAX_CHAR_SIZE_PER_POST[source];

    return post.poll
        ? Math.min(
              currentMax,
              source !== Source.Twitter ? 255 + readChars(post.chars, 'invisible', source).length : currentMax,
          )
        : currentMax;
}

function resolveUsedLength(sources: SocialSource[], chars: Chars) {
    const profile = getProfileState(Source.Twitter).currentProfile;
    // X > Bluesky > Farcaster > X premium > Lens
    const sortedSources: SocialSource[] = profile?.verified
        ? [Source.Bsky, Source.Farcaster, Source.Twitter, Source.Lens]
        : [Source.Twitter, Source.Bsky, Source.Farcaster, Source.Lens];

    const firstAvailableSource = sortedSources.find((source) => sources.includes(source));

    if (!firstAvailableSource) return 0;

    return resolveLengthCalculator(firstAvailableSource)(readChars(chars, 'visible', firstAvailableSource));
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
                    resolveLengthCalculator(source)(readChars(chars, 'invisible', source)),
            ),
        ),
    };
}
