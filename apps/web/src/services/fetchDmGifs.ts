import urlcat from 'urlcat';

import { fetchJson } from '@/helpers/fetchJson.js';

export interface DmGif {
    id: string;
    url: string;
    preview: string;
    width: number;
    height: number;
}

interface GiphyImage {
    url?: string;
    webp?: string;
    width?: string;
    height?: string;
}

interface GiphyResult {
    id?: string;
    images?: {
        downsized?: GiphyImage;
        fixed_width?: GiphyImage;
        original?: GiphyImage;
    };
}

function toPositiveNumber(value: string | undefined, fallback: number) {
    const number = Number(value);
    return Number.isFinite(number) && number > 0 ? number : fallback;
}

export function formatDmGif(result: GiphyResult): DmGif | null {
    const images = result.images;
    if (!result.id || !images) return null;

    const url = images.downsized?.url ?? images.original?.webp ?? images.original?.url;
    const preview = images.fixed_width?.webp ?? images.fixed_width?.url ?? url;
    if (!url || !preview) return null;

    const dimensions = images.fixed_width ?? images.downsized ?? images.original;
    return {
        id: result.id,
        url,
        preview,
        width: toPositiveNumber(dimensions?.width, 200),
        height: toPositiveNumber(dimensions?.height, 200),
    };
}

export async function fetchDmGifs(query: string, signal?: AbortSignal): Promise<DmGif[]> {
    const normalizedQuery = query.trim();
    const response = await fetchJson<{ data?: GiphyResult[] }>(
        urlcat('/api/giphy', {
            q: normalizedQuery || undefined,
        }),
        { signal },
    );
    return (response.data ?? []).flatMap((result) => {
        const gif = formatDmGif(result);
        return gif ? [gif] : [];
    });
}
