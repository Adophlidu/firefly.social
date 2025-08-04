import { NobleEd25519Signer } from '@farcaster/core';
import { bytesToHex, toBytes } from 'viem';

import { farcasterSessionHolder } from '@/providers/farcaster/SessionHolder.js';

function bufferToBase64Url(buffer: Buffer) {
    const base64 = buffer.toString('base64');
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/[=]+$/, '');
}

export async function getFarcasterAuthToken() {
    const { token, profileId } = farcasterSessionHolder.sessionRequired;
    const fid = Number.parseInt(profileId, 10);

    const signer = new NobleEd25519Signer(toBytes(token));
    const publicKey = await signer.getSignerKey();
    if (publicKey.isErr()) throw new Error('Failed to get signer key.');

    const payload = { exp: Math.floor(Date.now() / 1000) + 300 }; // 5 minutes
    const encodedPayload = bufferToBase64Url(Buffer.from(JSON.stringify(payload)));
    const encodedHeader = bufferToBase64Url(
        Buffer.from(
            JSON.stringify({
                fid,
                type: 'app_key',
                key: bytesToHex(publicKey.value),
            }),
        ),
    );
    const signatureResult = await signer.signMessageHash(Buffer.from(`${encodedHeader}.${encodedPayload}`, 'utf-8'));
    if (signatureResult.isErr()) throw new Error('Failed to sign message');

    const encodedSignature = bufferToBase64Url(Buffer.from(signatureResult.value));
    return [encodedHeader, encodedPayload, encodedSignature].join('.');
}
