import type { SocialSourceInURL, SourceInURL } from '@dimensiondev/workers-shared/constants/source.js';
import { SORTED_SOCIAL_SOURCES } from '@dimensiondev/workers-shared/constants/source.js';
import { resolveSourceInUrl, resolveSourceInUrlForApi } from '@dimensiondev/workers-shared/helpers/resolveSource.js';

export function isSocialSourceInUrl(sourceInUrl?: SourceInURL): sourceInUrl is SocialSourceInURL {
    if (!sourceInUrl) return false;
    return SORTED_SOCIAL_SOURCES.some(
        (source) => resolveSourceInUrl(source) === sourceInUrl || resolveSourceInUrlForApi(source) === sourceInUrl,
    );
}
