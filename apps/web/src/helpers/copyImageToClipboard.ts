/**
 * Whether the browser can copy a PNG to the clipboard. Safari requires the promise-form
 * ClipboardItem payload, which `copyImageToClipboard` uses; when ClipboardItem is missing
 * entirely the Copy entry should be hidden (FW-7696 R1).
 */
export function supportsImageClipboard(): boolean {
    return typeof ClipboardItem !== 'undefined' && typeof navigator !== 'undefined' && !!navigator.clipboard?.write;
}

export async function copyImageToClipboard(imageUrl: string): Promise<void> {
    if (!supportsImageClipboard()) throw new Error('Clipboard image copy is not supported in this browser.');
    const blobPromise = fetch(imageUrl).then(async (response) => {
        if (!response.ok) throw new Error(`Failed to fetch image (${response.status})`);
        const blob = await response.blob();
        // ClipboardItem rejects types other than image/png in most browsers
        return blob.type === 'image/png' ? blob : new Blob([blob], { type: 'image/png' });
    });
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blobPromise })]);
}
