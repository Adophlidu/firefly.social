import { compact, first } from 'lodash-es';
import urlcat from 'urlcat';

import { env } from '@/constants/env.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { MediaSource } from '@/types/compose.js';
import { type IGif } from '@/types/giphy.js';

interface FetchTenorGifsOptions {
    cursor?: string;
    q?: string;
    limit?: number;
}

interface TenorGif {
    id: string;
    title: string;
    content_description: string;
    media: Array<
        Record<
            'gif' | 'tinygif',
            {
                url: string;
                preview: string;
                dims: [number, number];
                size: number;
                duration: number;
            }
        >
    >;
}

function formatTenorGif(gif: TenorGif): IGif | null {
    const tinygif = first(gif.media)?.tinygif;
    const defaultGif = first(gif.media)?.gif;

    return tinygif && defaultGif
        ? {
              type: 'gif',
              id: gif.id,
              slug: gif.title,
              url: tinygif.url,
              bitly_gif_url: tinygif.url,
              bitly_url: tinygif.url,
              embed_url: tinygif.url,
              username: '',
              source: MediaSource.Tenor,
              rating: 'g',
              content_url: tinygif.url,
              source_tld: '',
              source_post_url: '',
              is_indexable: true,
              is_sticker: false,
              import_datetime: '',
              trending_datetime: '',
              user: {} as unknown as IGif['user'],
              images: {
                  original: {
                      url: defaultGif.url,
                      width: defaultGif.dims[0],
                      height: defaultGif.dims[1],
                      size: defaultGif.size?.toString(),
                  },
                  preview: {
                      url: defaultGif.preview || defaultGif.url,
                      width: defaultGif.dims[0],
                      height: defaultGif.dims[1],
                      size: defaultGif.size.toString(),
                  },
                  preview_gif: {
                      url: tinygif.url,
                      width: tinygif.dims[0],
                      height: tinygif.dims[1],
                      size: tinygif.size.toString(),
                  },
              } as IGif['images'],
              title: gif.title || gif.content_description,
              is_hidden: false,
              is_scheduled: false,
              is_removed: false,
              tags: [],
              bottle_data: {},
              response_id: '',
              analytics_response_payload: '',
          }
        : null;
}

export async function fetchTenorGifs({ cursor, q, limit = 20 }: FetchTenorGifsOptions): Promise<{
    data: IGif[];
    cursor: string;
}> {
    const response = await fetchJson<{
        results: TenorGif[];
        next: string;
    }>(
        urlcat('https://g.tenor.com/v1/search', {
            key: env.external.NEXT_PUBLIC_TENOR_API_KEY,
            q,
            contentfilter: 'high', // content safety level
            media_filter: 'minimal',
            limit,
            pos: cursor,
        }),
    );

    return {
        data: compact(response.results.map(formatTenorGif)),
        cursor: response.next || '',
    };
}
