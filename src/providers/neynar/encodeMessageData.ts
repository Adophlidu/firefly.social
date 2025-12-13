import type { MessageData } from '@farcaster/core'; /* type only on runtime code */
import urlcat from 'urlcat';

import { FIREFLY_WORKER_HOST } from '@/constants/static.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { resolveResponseData } from '@/helpers/resolveResponseData.js';
import { farcasterSessionHolder } from '@/providers/farcaster/SessionHolder.js';
import type { PartialWith, ResponseJson } from '@/types/utility.js';

type EncodeMessageDataResponse = ResponseJson<{
    signer: `0x${string}`;
    messageData: MessageData;
    messageJson: unknown;
    messageBytes: `0x${string}`;
    messageDataHash: `0x${string}`;
    messageDataSignature: `0x${string}`;
}>;

export type WithMessageData = (fid: number) => PartialWith<MessageData, 'type' | 'fid' | 'timestamp' | 'network'>;

export async function encodeMessageData(withMessageData: WithMessageData) {
    const { token, profileId } = farcasterSessionHolder.sessionRequired;

    const response = await fetchJson<EncodeMessageDataResponse>(
        urlcat(FIREFLY_WORKER_HOST, '/farcaster-message/encode'),
        {
            method: 'POST',
            body: JSON.stringify({
                profileId,
                token /* TODO: encrypt the private key */,
                data: withMessageData(Number.parseInt(profileId, 10)),
            }),
        },
    );

    const data = resolveResponseData(response);
    return data;
}
