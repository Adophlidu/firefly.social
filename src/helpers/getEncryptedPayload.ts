'use client';

export type EncryptedPayload = readonly [string | Uint8Array, '1' | '2', string | null];

const POST_DATA_REGEX = /(?:.*)PostData_(v1|v2)=(.*)/;

export function getEncryptedPayloadFromText(text: string | undefined): EncryptedPayload | undefined {
    if (!text) return;

    const matched = text.match(POST_DATA_REGEX);
    if (!matched) return;

    const [, version, payload] = matched;

    if (version === 'v1') return [payload, '1', null];
    if (version === 'v2') return [payload, '2', null];
    return;
}
