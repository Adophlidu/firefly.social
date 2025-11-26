import { FarcasterSession } from '@/providers/farcaster/Session.js';
import { createSignedKey } from '@/providers/warpcast/createSignedKey.js';
import { createSignedKeyPayloadWithPublicKey } from '@/providers/warpcast/createSignedKeyPayload.js';

interface Options {
    publickey: string;
    privatekey: string;
    fid: string;
    address?: string;
    signal?: AbortSignal;
}
export async function createFarcasterSessionBySigner({ publickey, privatekey, fid, address, signal }: Options) {
    const payload = await createSignedKeyPayloadWithPublicKey(publickey, signal);
    const key = await createSignedKey(payload.body, signal);
    return new FarcasterSession(
        fid,
        privatekey,
        payload.timestamp,
        payload.expiresAt,
        key.token,
        undefined,
        undefined,
        address,
    );
}
