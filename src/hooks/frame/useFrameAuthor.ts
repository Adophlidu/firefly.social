import { parseJson } from '@dimensiondev/utils';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { Source } from '@/constants/enum.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { type FrameV2 } from '@/types/frame.js';

export function useFrameAuthor(frame: FrameV2 | undefined) {
    const authorFid = useMemo(() => {
        if (!frame?.x_manifest?.accountAssociation?.header) return null;
        const raw = atob(frame.x_manifest.accountAssociation.header);
        return parseJson<{ fid: number }>(raw)?.fid.toString();
    }, [frame]);
    return useQuery({
        enabled: !!authorFid,
        queryKey: ['profile', Source.Farcaster, authorFid],
        queryFn: () => {
            if (!authorFid) return null;
            const provider = resolveSocialMediaProvider(Source.Farcaster);
            return provider.getProfileById(authorFid, true);
        },
    });
}
