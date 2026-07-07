import type { BookmarkType , FireflyPlatform } from '@dimensiondev/enums';
import { skipToken, useQuery } from '@tanstack/react-query';

import { STALE_TIMES } from '@/constants/query.js';
import { useIsLogin } from '@/hooks/useIsLogin.js';
import { getFireflyBookmarksByIds } from '@/providers/firefly/endpoint/getFireflyBookmarkIds.js';

export function useHasBookmarked(platform: FireflyPlatform, id: string, postType?: BookmarkType, disabled?: boolean) {
    const isLogin = useIsLogin();
    const lowerCaseId = id.toLowerCase();

    const result = useQuery({
        queryKey: ['has-bookmarked', platform, id, isLogin],
        staleTime: STALE_TIMES.MINUTE_5,
        enabled: !disabled && isLogin,
        queryFn: disabled
            ? skipToken
            : async () => {
                  const data = await getFireflyBookmarksByIds(platform, [id], postType);

                  const matched = data.find(
                      (x) => x.post_id.toLowerCase() === lowerCaseId && x.has_book_marked === true,
                  );
                  return matched ? { status: matched.has_book_marked, id: matched.post_id } : null;
              },
    });

    return {
        ...result,
        data: result.data?.status === true,
        bookmarkId: result.data?.id,
    };
}
