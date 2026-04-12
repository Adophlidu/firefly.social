import { fetchAccountsBulk } from '@lens-protocol/client/actions';

import { CharTag, FireflyPlatform } from '@/constants/enum.js';
import { MENTION_REGEX } from '@/constants/regexp.js';
import { ensureLensResult } from '@/providers/lens/ensureLensResult.js';
import { lensClientHolder } from '@/providers/lens/LensClientHolder.js';
import type { Chars } from '@/types/chars.js';

export async function detectMentionsForLens(chars: Chars) {
    const list = (Array.isArray(chars) ? chars : [chars]).slice();

    const existedMentions = list.filter((item) => typeof item !== 'string' && item.tag === CharTag.MENTION);
    const mentions = list.reduce<string[]>((acc, item) => {
        if (typeof item !== 'string') return acc;

        const matched = item.match(MENTION_REGEX);
        if (matched) {
            const mention = matched[0];
            if (existedMentions.some((x) => x.content === mention)) return acc;

            if (!acc.includes(mention) && !mention.includes('/')) {
                acc.push(mention);
            }
        }

        return acc;
    }, []);
    if (!mentions.length) return list;

    const accounts = await ensureLensResult(
        fetchAccountsBulk(lensClientHolder.client, {
            usernames: mentions.map((mention) => ({ localName: mention.slice(1) })),
        }),
    );
    if (!accounts.length && !existedMentions.length) return list;

    return list.map((item) => {
        if (typeof item !== 'string') return item;

        const matched = item.match(MENTION_REGEX);
        if (matched) {
            const mention = matched[0];
            const existedMention = existedMentions.find((x) => x.content === mention);
            const mentionProfile = existedMention?.profiles.find((x) => x.platform === FireflyPlatform.Lens);
            if (mentionProfile?.handle) {
                return item.replace(mention, `@lens/${mentionProfile.handle}`);
            }

            const account = accounts.find((account) => account.username?.localName === mention.slice(1));
            if (account?.username?.value) {
                return item.replace(mention, `@${account.username?.value}`);
            }
        }

        return item;
    });
}
