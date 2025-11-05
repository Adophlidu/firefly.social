import { skipToken, useQuery } from '@tanstack/react-query';

import { getClassifyPostLink, getClassifyPostLinks } from '@/services/getClassifyPostLink.js';

export function useClassifyPostLink(url: string | null | undefined) {
    return useQuery({
        queryKey: ['classify-post-link', url],
        staleTime: 1000 * 60 * 30, // 30 minutes
        queryFn: url ? () => getClassifyPostLink(url) : skipToken,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        retry: false,
    });
}

export function useClassifyPostLinks(urls: string[]) {
    return useQuery({
        queryKey: ['classify-post-link', ...urls],
        staleTime: 1000 * 60 * 30, // 30 minutes
        queryFn: urls.length ? () => getClassifyPostLinks(urls) : skipToken,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        retry: false,
    });
}
