import { skipToken, useQueries, useQuery } from '@tanstack/react-query';

import {
    getClassifyPostLinkWithDeserialization,
    getClassifyPostLinkWithDeserializationMultiple,
} from '@/app/api/post-link/getClassifyPostLinkWithDeserialization.js';

export function useClassifyPostLink(url: string | null | undefined) {
    return useQuery({
        queryKey: ['classify-post-link', url],
        queryFn: url ? () => getClassifyPostLinkWithDeserialization(url) : skipToken,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        retry: false,
    });
}

export function useClassifyPostLinkMultiple(urls: string[]) {
    return useQuery({
        queryKey: ['classify-post-link', ...urls],
        staleTime: 1000 * 60 * 30, // 30 minutes
        queryFn: urls.length ? () => getClassifyPostLinkWithDeserializationMultiple(urls) : skipToken,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        retry: false,
    });
}

export function useClassifyPostLinks(urls: string[]) {
    return useQueries({
        queries: urls.map((url) => ({
            queryKey: ['classify-post-link', url],
            queryFn: () => (url ? getClassifyPostLinkWithDeserialization(url) : null),
            refetchOnMount: false,
            refetchOnWindowFocus: false,
            retry: false,
        })),
        combine(result) {
            return result.map((query) => query.data);
        },
    });
}
