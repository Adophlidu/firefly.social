export async function blobToBase64(blob: Blob): Promise<`data:${string}`> {
    try {
        const arrayBuffer = await blob.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);

        // Convert binary data to base64 string
        let binary = '';
        for (const byte of bytes) {
            binary += String.fromCharCode(byte);
        }

        const base64 = btoa(binary);
        const mimeType = blob.type || 'application/octet-stream';

        return `data:${mimeType};base64,${base64}` as `data:${string}`;
    } catch (error) {
        throw new Error(`Failed to convert blob to base64: ${error}`);
    }
}
