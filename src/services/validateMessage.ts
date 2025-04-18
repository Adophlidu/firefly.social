import { Message } from '@farcaster/core';
import { safeUnreachable } from '@masknet/kit';
import urlcat from 'urlcat';

import { type SocialSource, Source } from '@/constants/enum.js';
import { NEYNAR_URL } from '@/constants/index.js';
import { fetchNeynarStream } from '@/helpers/fetchNeynar.js';

async function validateFarcasterMessage(messageBytes: string): Promise<boolean> {
    const url = urlcat(NEYNAR_URL, '/v1/validateMessage');
    const { valid } = await fetchNeynarStream<{ valid: boolean; message: Message }>(url, {
        method: 'POST',
        body: Buffer.from(messageBytes, 'hex'),
    });
    if (valid) return true;
    return false;
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
