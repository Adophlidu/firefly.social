export function base64ToFile(base64: `data:${string}`, filename: string) {
    const [metaData, base64Data] = base64.split(',');
    const mimeType = metaData.split(':')[1].split(';')[0];

    const binaryData = atob(base64Data);
    const arrayBuffer = new Uint8Array(binaryData.length);

    for (let i = 0; i < binaryData.length; i += 1) {
        arrayBuffer[i] = binaryData.charCodeAt(i);
    }

    return new File([new Blob([arrayBuffer], { type: mimeType })], filename, { type: mimeType });
}
