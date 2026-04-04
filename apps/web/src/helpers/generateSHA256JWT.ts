async function encodeBase64Url(input: string | Uint8Array): Promise<string> {
    const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : input;
    const base64String = btoa(String.fromCharCode(...bytes));
    return base64String.replace(/\+/g, '-').replace(/\//g, '_').replace(/[=]+$/, '');
}

export async function generateSHA256JWT(payload: Record<string, unknown>, secretKey: string): Promise<string> {
    const header = {
        alg: 'HS256',
        typ: 'JWT',
    };
    const encodedHeader = await encodeBase64Url(JSON.stringify(header));
    const encodedPayload = await encodeBase64Url(JSON.stringify(payload));

    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', enc.encode(secretKey), { name: 'HMAC', hash: 'SHA-256' }, false, [
        'sign',
    ]);

    const signature = await crypto.subtle.sign('HMAC', key, enc.encode(`${encodedHeader}.${encodedPayload}`));

    const signatureArray = new Uint8Array(signature);
    const base64urlSignature = await encodeBase64Url(signatureArray);

    return `${encodedHeader}.${encodedPayload}.${base64urlSignature}`;
}
