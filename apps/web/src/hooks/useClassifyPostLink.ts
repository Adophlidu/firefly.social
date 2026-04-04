import { skipToken, useQuery } from '@tanstack/react-query';

import { STALE_TIMES } from '@/constants/query.js';
import { getClassifyPostLinks } from '@/providers/firefly/worker/getClassifyPostLinks.js';

export function useClassifyPostLink(url: string | null | undefined) {
    return useQuery({
        queryKey: ['classify-post-links', url],
        staleTime: STALE_TIMES.MINUTE_30,

        queryFn: url ? () => getClassifyPostLinks([url]) : skipToken,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        retry: false,
        select: (data) => (data.length ? data[0].result : null),
    });
}

export function useClassifyPostLinks(urls: string[]) {
    return useQuery({
        queryKey: ['classify-post-links', ...urls],
        staleTime: STALE_TIMES.MINUTE_30,

        queryFn: urls.length ? () => getClassifyPostLinks(urls) : skipToken,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        retry: false,
    });
}
