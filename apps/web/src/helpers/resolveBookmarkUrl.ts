import type { BookmarkSource } from '@dimensiondev/enums';
import urlcat from 'urlcat';

import { resolveSourceInUrl } from '@/helpers/resolveSourceInUrl.js';

export function resolveBookmarkUrl(source: BookmarkSource) {
    return urlcat('/bookmarks/:source', { source: resolveSourceInUrl(source) });
}
