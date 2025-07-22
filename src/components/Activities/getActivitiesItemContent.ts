import { getArticleItemContent } from '@/components/VirtualList/getArticleItemContent.js';
import { getSnapshotItemContent } from '@/components/VirtualList/getSnapshotItemContent.js';
import { ScrollListKey, Source } from '@/constants/enum.js';
import { safeUnreachable } from '@/helpers/unreachable.js';
import type { ActivitiesItem } from '@/providers/types/Firefly.js';

export function getActivitiesItemContent(index: number, data: ActivitiesItem, listKey: ScrollListKey) {
    switch (data.source) {
        case Source.Article:
            return getArticleItemContent(index, data.data, `${listKey}:${Source.Activities}`);
        case Source.DAOs:
            return getSnapshotItemContent(index, data.data);
        default:
            safeUnreachable(data);
            return null;
    }
}
