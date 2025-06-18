import urlcat from 'urlcat';

import { SITE_URL } from '@/constants/index.js';

export function getFireflyProfileURL(uid: string) {
    return urlcat(SITE_URL, '/profile/:uid', {
        uid,
    });
}
