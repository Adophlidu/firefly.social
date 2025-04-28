export const blobToBase64 = (blob: Blob): Promise<`data:${string}`> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as `data:${string}`);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};
