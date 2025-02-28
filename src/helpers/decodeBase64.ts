export function decodeBase64(str: string) {
    const binary = atob(str);
    const bytes = new Uint8Array(new ArrayBuffer(binary.length));
    const half = binary.length / 2;
    for (let i = 0, j = binary.length - 1; i <= half; i += 1, j -= 1) {
        bytes[i] = binary.charCodeAt(i);
        bytes[j] = binary.charCodeAt(j);
    }
    return bytes;
}
