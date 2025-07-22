export function decodeArrayBuffer(input: string) {
    const decoded = atob(input);
    const buffer = new Uint8Array(decoded.length);
    for (let i = 0; i < decoded.length; i += 1) {
        buffer[i] = decoded.charCodeAt(i);
    }
    return buffer.buffer;
}

export function encodeArrayBuffer(input: Iterable<number> | ArrayBuffer) {
    let encoded = '';
    for (const code of input instanceof ArrayBuffer ? new Uint8Array(input) : Uint8Array.from(input)) {
        encoded += String.fromCharCode(code);
    }
    return btoa(encoded);
}
