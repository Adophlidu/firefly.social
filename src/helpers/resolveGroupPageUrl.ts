import urlcat from 'urlcat';

import { GroupTabType } from '@/constants/enum.js';

export function resolveGroupPageUrl(groupId: string, tabType = GroupTabType.Posts) {
    return urlcat('/group/:id/:type', { id: groupId, type: tabType });
}
