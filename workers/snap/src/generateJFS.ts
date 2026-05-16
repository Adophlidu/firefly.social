import {
    getPublicKeyInHexFromPrivateKey,
    signMessageWithPrivateKey,
} from '@dimensiondev/workers-farcaster-message/ed25519.js';
import { bytesToBase64url, stringToBytes } from '@dimensiondev/workers-shared/helpers/base64url.js';

import type { SnapJFSPayload } from '@/snap/src/types.js';

/**
 * Generate a JSON Farcaster Signature (JFS) request body for a snap action.
 *
 * The signing input is `BASE64URL(header).BASE64URL(payload)` (ASCII bytes).
 * The returned body is a JSON object `{ header, payload, signature }` as required
 * by the snap server's `verifyJFSRequestBody` verification.
 *
 * @see https://github.com/farcasterxyz/snap/blob/main/pkgs/snap/src/verify.test.ts
 */
export async function generateJFS(privateKey: string, payload: SnapJFSPayload): Promise<string> {
    const publicKey = await getPublicKeyInHexFromPrivateKey(privateKey);
    if (!publicKey) throw new Error('[snap] unable to derive public key from private key');
    const fid = payload.user?.fid ?? payload.fid;
    if (!fid) throw new Error('[snap] missing user fid in JFS payload');

    const header = {
        fid,
        type: 'app_key',
        key: publicKey,
    };

    const headerEncoded = bytesToBase64url(stringToBytes(JSON.stringify(header)));
    const payloadEncoded = bytesToBase64url(stringToBytes(JSON.stringify(payload)));

    const signingInput = `${headerEncoded}.${payloadEncoded}`;
    const signingBytes = stringToBytes(signingInput);

    const signature = await signMessageWithPrivateKey(privateKey, signingBytes);
    if (!signature) throw new Error('[snap] failed to sign JFS payload');

    const signatureEncoded = bytesToBase64url(signature);

    return JSON.stringify({
        header: headerEncoded,
        payload: payloadEncoded,
        signature: signatureEncoded,
    });
}
