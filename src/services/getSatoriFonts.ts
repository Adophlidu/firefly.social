/* cspell:disable */

import type { Font } from 'satori';
import urlcat from 'urlcat';

import { SITE_URL } from '@/constants/index.js';
import { fetchArrayBuffer } from '@/helpers/fetchArrayBuffer.js';

export async function getSatoriFonts(signal?: AbortSignal) {
    return [
        {
            name: 'Inter',
            data: await fetchArrayBuffer(urlcat(SITE_URL, '/font/Inter-Regular.ttf'), {
                cache: 'force-cache',
                signal,
            }),
            weight: 400,
            style: 'normal',
        },
        {
            name: 'Inter',
            data: await fetchArrayBuffer(urlcat(SITE_URL, '/font/Inter-Bold.ttf'), {
                cache: 'force-cache',
                signal,
            }),
            weight: 700,
            style: 'normal',
        },

        {
            name: 'NotoSans',
            data: await fetchArrayBuffer(urlcat(SITE_URL, '/font/NotoSans-Regular.ttf'), {
                cache: 'force-cache',
                signal,
            }),
            weight: 400,
            style: 'normal',
        },
        {
            name: 'NotoSans',
            data: await fetchArrayBuffer(urlcat(SITE_URL, '/font/NotoSans-Bold.ttf'), {
                cache: 'force-cache',
                signal,
            }),
            weight: 700,
            style: 'normal',
        },
    ] satisfies Font[];
}
