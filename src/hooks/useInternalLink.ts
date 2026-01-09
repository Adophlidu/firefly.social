import { useQuery } from '@tanstack/react-query';
import { type UrlObject } from 'url';

import { formatExternalLink } from '@/helpers/formatExternalLink.js';

export function useInternalLink(href: string | UrlObject) {
    return useQuery({
        queryKey: ['link-transform', href],
        enabled: typeof href === 'string' && href.startsWith('http'),
        staleTime: Infinity,
        queryFn: async () => {
            try {
                if (typeof href !== 'string' || !href.startsWith('http')) return '';
                return (await formatExternalLink(href)) ?? '';
            } catch {
                return '';
            }
        },
    });
}
