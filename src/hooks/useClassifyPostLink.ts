import { skipToken, useQuery } from '@tanstack/react-query';

import { getClassifyPostLinks } from '@/providers/firefly/worker/getClassifyPostLinks.js';

export function useClassifyPostLink(url: string | null | undefined) {
    return useQuery({
        queryKey: ['classify-post-links', url],
        staleTime: 1000 * 60 * 30, // 30 minutes
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
        staleTime: 1000 * 60 * 30, // 30 minutes
        queryFn: urls.length ? () => getClassifyPostLinks(urls) : skipToken,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        retry: false,
    });
}
