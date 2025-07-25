import { getPublicKeyInHexFromPrivateKey, signMessageWithPrivateKey } from '@/providers/farcaster/ed25519.js';
import { farcasterSessionHolder } from '@/providers/farcaster/SessionHolder.js';

function bufferToBase64Url(buffer: Buffer) {
    const base64 = buffer.toString('base64');
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/[=]+$/, '');
}

export async function getFarcasterAuthToken() {
    const { token, profileId } = farcasterSessionHolder.sessionRequired;

    const publicKey = await getPublicKeyInHexFromPrivateKey(token);
    const fid = Number.parseInt(profileId, 10);

    const payload = { exp: Math.floor(Date.now() / 1000) + 300 }; // 5 minutes
    const encodedPayload = bufferToBase64Url(Buffer.from(JSON.stringify(payload)));
    const encodedHeader = bufferToBase64Url(
        Buffer.from(
            JSON.stringify({
                fid,
                type: 'app_key',
                key: publicKey,
            }),
        ),
    );
    const signature = await signMessageWithPrivateKey(
        token,
        Buffer.from(`${encodedHeader}.${encodedPayload}`, 'utf-8'),
    );
    if (!signature) throw new Error('Failed to sign message');

    const encodedSignature = bufferToBase64Url(Buffer.from(signature));
    return [encodedHeader, encodedPayload, encodedSignature].join('.');
}
