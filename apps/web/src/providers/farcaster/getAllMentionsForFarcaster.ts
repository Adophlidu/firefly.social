import { first } from 'lodash-es';

import { Source } from '@/constants/enum.js';
import { CastType } from '@/constants/farcaster.js';
import { FARCASTER_MENTION_REGEX } from '@/constants/regexp.js';
import { logger } from '@/libs/Logger.js';
import { searchProfiles } from '@/providers/neynar/searchProfiles.js';
import { resolveLengthCalculator } from '@/services/resolveLengthCalculator.js';

export async function getAllMentionsForFarcaster(text: string) {
    const replacedIndices = [];
    const mentions = [];
    if (!text) {
        return {
            text: '',
            mentionsPositions: [],
            mentions: [],
            type: CastType.CAST,
        };
    }
    let match;
    const regex = new RegExp(FARCASTER_MENTION_REGEX);
    while ((match = regex.exec(text)) !== null) {
        try {
            let mentionTag = '';
            if (!match[0]) continue;
            mentionTag = match[0].substring(1);
            const profiles = await searchProfiles(mentionTag);
            const profile = first(profiles.data);
            if (profile?.fullHandle !== mentionTag) continue;
            const fid = profile?.profileId;
            if (fid) {
                mentions.push(Number(fid));
                const startIndex = match.index;
                const mentionStartIndex = Buffer.from(text.substring(0, startIndex)).length;
                const endIndex = regex.lastIndex;
                replacedIndices.push(mentionStartIndex);
                text = text.substring(0, startIndex) + text.substring(endIndex);
                regex.lastIndex = startIndex;
            }
        } catch (error) {
            logger.error(`[getAllMentionsForFarcaster]: ${error}`);
        }
    }

    const length = resolveLengthCalculator(Source.Farcaster)(text);

    const castType = length > 1024 ? CastType.TEN_K_CAST : length > 320 ? CastType.LONG_CAST : CastType.CAST;
    return {
        text,
        mentionsPositions: replacedIndices,
        mentions,
        type: castType,
    };
}
