/**
 * Processes a base64 data URL string and creates a File object
 * @param base64 - Base64 data URL string in format: data:[mime-type];base64,[data]
 * @param filename - Name for the File object
 * @returns File object with proper MIME type and binary data
 * @throws Error if base64 format is invalid
 */
export function base64ToFile(base64: string, filename: string): File {
    // Extract MIME type and base64 data using regex
    const mimeMatch = base64.match(/^data:([^;]+);base64,(.+)$/);
    if (!mimeMatch) {
        throw new Error('Invalid base64 format. Expected data URL format: data:[mime-type];base64,[data]');
    }

    const [, mimeType, base64Data] = mimeMatch;

    // Decode base64 data
    const binaryData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

    // Create File object from binary data
    return new File([binaryData], filename, {
        type: mimeType,
    });
}
