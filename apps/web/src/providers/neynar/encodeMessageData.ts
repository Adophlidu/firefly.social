import { farcasterWorker } from '@dimensiondev/workers-client';
import type { MessageData } from '@farcaster/core'; /* type only on runtime code */

import { resolveResponseData } from '@/helpers/resolveResponseData.js';
import type { FarcasterSession } from '@/providers/farcaster/Session.js';
import { farcasterSessionHolder } from '@/providers/farcaster/SessionHolder.js';
import type { PartialWith, ResponseJson } from '@/types/utility.js';

type PartialMessageData = PartialWith<MessageData, 'type' | 'fid' | 'timestamp' | 'network'>;

type EncodeMessageDataResponse = ResponseJson<{
    signer: `0x${string}`;
    messageData: MessageData;
    messageJson: unknown;
    messageBytes: `0x${string}`;
    messageDataHash: `0x${string}`;
    messageDataSignature: `0x${string}`;
}>;

type WithMessageData = PartialMessageData | ((fid: number) => PartialMessageData);

export async function encodeMessageData(withMessageData: WithMessageData, session?: FarcasterSession) {
    const { token, profileId } = session ?? farcasterSessionHolder.sessionRequired;
    const messageData =
        typeof withMessageData === 'function' ? withMessageData(Number.parseInt(profileId, 10)) : withMessageData;

    const res = await farcasterWorker.farcaster.message.encode.$post({
        json: {
            profileId,
            token,
            data: messageData,
        },
    });
    const response = (await res.json()) as EncodeMessageDataResponse;

    const data = resolveResponseData(response);
    return data;
}
