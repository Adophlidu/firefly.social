import { Transformer } from '@napi-rs/image';

export async function fetchAvatarAsBase64(avatarURL: string) {
    const response = await fetch(avatarURL);
    if (!response.ok) return null;

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    if (contentType === 'image/png') {
        return `data:${contentType};base64,${buffer.toString('base64')}`;
    }
    const tf = new Transformer(buffer);
    const pngBuffer = await tf.png();
    return `data:image/png;base64,${pngBuffer.toString('base64')}`;
}
