import { createLookupTableResolver, runInSafeAsync, UnreachableError } from '@dimensiondev/utils';

import { type BookmarkSource, Source } from '@/constants/enum.js';
import { TelemetryProvider } from '@/providers/telemetry/index.js';
import { EventId } from '@/providers/types/Telemetry.js';

const resolveBookmarkTabEventId = createLookupTableResolver<BookmarkSource, EventId>(
    {
        [Source.Farcaster]: EventId.BOOKMARK_FARCASTER_TAB_CLICK,
        [Source.Lens]: EventId.BOOKMARK_LENS_TAB_CLICK,
        [Source.Bsky]: EventId.BOOKMARK_BSKY_TAB_CLICK,
        [Source.Prediction]: EventId.BOOKMARK_PREDICTIONS_TAB_CLICK,
        [Source.Article]: EventId.BOOKMARK_ARTICLE_TAB_CLICK,
        [Source.DAOs]: EventId.BOOKMARK_DAO_TAB_CLICK,
        [Source.NFTs]: EventId.TOKEN_BOOKMARK_CLICK, // Using TOKEN_BOOKMARK_CLICK as fallback
        [Source.Tokens]: EventId.TOKEN_BOOKMARK_CLICK,
    },
    (source) => {
        throw new UnreachableError('source', source);
    },
);

export function captureBookmarkTabClick(source: BookmarkSource) {
    return runInSafeAsync(() => {
        const eventId = resolveBookmarkTabEventId(source);
        return TelemetryProvider.captureEvent(eventId, {});
    });
}
