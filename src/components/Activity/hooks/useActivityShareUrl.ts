import urlcat from 'urlcat';

import { useActivityCurrentAccountHandle } from '@/components/Activity/hooks/useActivityCurrentAccountHandle.js';
import { PageRoute, type SocialSource, Source } from '@/constants/enum.js';
import { SITE_URL } from '@/constants/static.js';
import { resolveActivityShareUrl } from '@/helpers/resolveActivityUrl.js';

export function useActivityShareUrl(name?: string) {
    const source =
        (name
            ? (
                  {
                      hlbl: Source.Twitter,
                      elex24: Source.Twitter,
                      frensgiving: Source.Farcaster,
                      pengu: Source.Twitter,
                      trump: Source.Twitter,
                      buttrfly: Source.Lens,
                  } as Record<string, SocialSource>
              )[name]
            : undefined) ?? Source.Twitter;
    const handle = useActivityCurrentAccountHandle(source);
    if (!name) return urlcat(SITE_URL, PageRoute.Events);
    return resolveActivityShareUrl(name, source, handle);
}
