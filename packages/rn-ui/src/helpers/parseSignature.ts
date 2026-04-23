export function parseSignature(signature: string) {
    const raw = signature.startsWith('0x') ? signature.slice(2) : signature;

    if (raw.length !== 130) {
        throw new Error('Invalid signature length. Expected 130 hex characters (65 bytes).');
    }

    const r = '0x' + raw.slice(0, 64);
    const s = '0x' + raw.slice(64, 128);
    let v = parseInt(raw.slice(128, 130), 16);
    if (v < 27) {
        v += 27;
    }

    return { r, s, v };
}
