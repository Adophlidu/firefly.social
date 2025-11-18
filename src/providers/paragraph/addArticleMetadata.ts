import { fetchJson } from '@/helpers/fetchJson.js';
import type { ParagraphMintMetadata } from '@/providers/types/Firefly.js';

export async function addArticleMetadata(metadata: ParagraphMintMetadata) {
    const response = await fetchJson<{ success: true; id: string }>('https://api.paragraph.xyz/collectibles', {
        method: 'POST',
        body: JSON.stringify(metadata),
    });

    return response.id;
}
