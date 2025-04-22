import { imageSize } from 'image-size';

export async function getImageMetaFromUrl(
    url: string,
): Promise<{ width: number; height: number; base64: string; mime: string } | null> {
    try {
        const res = await fetch(url);
        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const size = imageSize(buffer);
        if (size.width && size.height && size.type) {
            const base64 = buffer.toString('base64');
            const mime = `image/${size.type}`;
            return { width: size.width, height: size.height, base64, mime };
        }
        return null;
    } catch {
        return null;
    }
}
