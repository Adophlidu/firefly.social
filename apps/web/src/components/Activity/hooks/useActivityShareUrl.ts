import type { SocialSource } from '@dimensiondev/enums';
import { PageRoute, Source } from '@dimensiondev/enums';
import { SITE_URL } from '@dimensiondev/envs/web';
import urlcat from 'urlcat';

import { useActivityCurrentAccountHandle } from '@/components/Activity/hooks/useActivityCurrentAccountHandle.js';
import { resolveActivityShareUrl } from '@/helpers/resolveActivityUrl.js';

const ACTIVITY_SHARE_URL_MAP: Record<string, SocialSource> = {
    hlbl: Source.Twitter,
    elex24: Source.Twitter,
    frensgiving: Source.Farcaster,
    pengu: Source.Twitter,
    trump: Source.Twitter,
    buttrfly: Source.Lens,
};

export function useActivityShareUrl(name?: string) {
    const source = (name ? ACTIVITY_SHARE_URL_MAP[name] : undefined) ?? Source.Twitter;
    const handle = useActivityCurrentAccountHandle(source);
    if (!name) return urlcat(SITE_URL, PageRoute.Events);
    return resolveActivityShareUrl(name, source, handle);
}
