import { twitterSessionHolder } from '@/providers/twitter/SessionHolder.js';
import { type ResponseJson } from '@/types/utility.js';

export async function uploadProfileAvatar(file: File) {
    const formData = new FormData();
    formData.set('file', file);
    const res = await twitterSessionHolder.fetch<ResponseJson<{ pfp: string }>>('/api/twitter/me/avatar', {
        method: 'PUT',
        body: formData,
    });
    if (!res.success) throw new Error('Failed to avatar.');
    return res.data.pfp;
}
