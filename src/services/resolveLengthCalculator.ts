import { createLookupTableResolver, NotImplementedError } from '@dimensiondev/utils';
import twitterText from 'twitter-text';

import { type SocialSource, Source } from '@/constants/enum.js';

// calculate length for farcaster in bytes
// learn more: https://hackmd.io/@farcasterxyz/BJeFoxdy3
function calculateLengthForFarcaster(text: string) {
    const encoder = new TextEncoder();
    const encodedText = encoder.encode(text);
    return encodedText.length;
}

function calculateLengthForLens(text: string) {
    return Array.from(text).reduce((acc, char) => {
        if (char.charCodeAt(0) > 128) {
            return acc + 2;
        } else {
            return acc + 1;
        }
    }, 0);
}

// learn more: https://github.com/twitter/twitter-text/tree/master/js
function calculateLengthForTwitter(text: string) {
    const { weightedLength } = twitterText.parseTweet(text);
    return weightedLength;
}

function calculateLengthForBsky(text: string) {
    return text.length;
}

export const resolveLengthCalculator = createLookupTableResolver<SocialSource, (text: string) => number>(
    {
        [Source.Lens]: calculateLengthForLens,
        [Source.Farcaster]: calculateLengthForFarcaster,
        [Source.Twitter]: calculateLengthForTwitter,
        [Source.Bsky]: calculateLengthForBsky,
    },
    (source: SocialSource) => {
        throw new NotImplementedError(`Length calculator for ${source} is not implemented`);
    },
);
