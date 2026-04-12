import { CharTag, type SocialSourceInURL } from '@/constants/enum.js';
import { resolveFireflyPlatformFromSocialSource } from '@/helpers/resolveFireflyPlatform.js';
import { resolveSocialSource } from '@/helpers/resolveSource.js';
import type { Profile as FireflyProfile } from '@/providers/types/Firefly.js';
import type { Chars } from '@/types/chars.js';

interface Mention {
    text: string;
    platform: Array<{
        uid: string;
        platform: SocialSourceInURL;
        handle: string;
    }>;
}

export function recoverCharsByMentions(text: string, mentions: Mention[]): Chars {
    if (!text || !mentions.length) return text;

    const result: Chars = [];
    let lastIndex = 0;

    const sortedArr = [...mentions].sort((a, b) => b.text.length - a.text.length);
    const matches: Array<{ start: number; end: number; item: Mention }> = [];
    sortedArr.forEach((item) => {
        let index = text.indexOf(item.text, 0);
        while (index !== -1) {
            matches.push({
                start: index,
                end: index + item.text.length,
                item,
            });
            index = text.indexOf(item.text, index + 1);
        }
    });
    if (!matches.length) return text;

    matches.sort((a, b) => a.start - b.start);

    const mergedMatches = [];
    for (const match of matches) {
        if (mergedMatches.length === 0 || match.start >= mergedMatches[mergedMatches.length - 1].end) {
            mergedMatches.push(match);
        } else {
            const last = mergedMatches[mergedMatches.length - 1];
            if (match.start < last.start) {
                mergedMatches[mergedMatches.length - 1] = match;
            }
        }
    }

    mergedMatches.forEach((match) => {
        if (match.start > lastIndex) {
            result.push(text.substring(lastIndex, match.start));
        }
        result.push({
            tag: CharTag.MENTION,
            visible: true,
            content: match.item.text,
            profiles: match.item.platform.map<FireflyProfile>((p) => ({
                platform: resolveFireflyPlatformFromSocialSource(resolveSocialSource(p.platform)),
                uid: p.uid,
                platform_id: p.uid,
                handle: p.handle,
                name: p.handle,
                hit: true,
                score: 1,
            })),
        });
        lastIndex = match.end;
    });

    if (lastIndex < text.length) {
        result.push(text.substring(lastIndex));
    }

    return result;
}
