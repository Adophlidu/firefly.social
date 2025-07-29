import urlcat from 'urlcat';

import { type SocialSource, Source } from '@/constants/enum.js';
import { NEYNAR_URL } from '@/constants/index.js';
import { fetchNeynarStream } from '@/helpers/fetchNeynarJson.js';
import { resolveNeynarResponseData } from '@/helpers/resolveNeynarResponseData.js';
import { safeUnreachable } from '@/helpers/unreachable.js';

async function validateFarcasterMessage(messageBytes: string): Promise<boolean> {
    const url = urlcat(NEYNAR_URL, '/v1/validateMessage');
    const response = await fetchNeynarStream<{ valid: boolean }>(url, {
        method: 'POST',
        body: Buffer.from(messageBytes, 'hex'),
    });
    const { valid } = resolveNeynarResponseData(response);
    return valid;
}

export async function validateMessage(messageBytes: string, source: SocialSource): Promise<boolean> {
    switch (source) {
        case Source.Farcaster:
            return validateFarcasterMessage(messageBytes);
        case Source.Lens:
            return true;
        case Source.Twitter:
            return true;
        case Source.Bsky:
            return true;
        default:
            safeUnreachable(source);
            return false;
    }
}
