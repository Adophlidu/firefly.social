'use client';

import type { SocialSourceInURL } from '@dimensiondev/enums';
import { SearchType, Source } from '@dimensiondev/enums';
import { Trans } from '@lingui/react/macro';

import { NotFound } from '@/components/NotFound.js';
import { useParams } from '@/esm/navigation.js';
import { isSocialSourceInUrl } from '@/helpers/isSource.js';
import { resolveSocialSource } from '@/helpers/resolveSource.js';

export default function ChannelNotFound() {
    const params = useParams<{ id: string; source: SocialSourceInURL }>();
    const id = decodeURIComponent(params.id);
    const socialSource = isSocialSourceInUrl(params.source) ? resolveSocialSource(params.source) : undefined;
    const isLens = socialSource === Source.Lens;

    return (
        <NotFound
            backText={isLens ? <Trans>Group</Trans> : <Trans>Channel</Trans>}
            text={
                isLens ? <Trans>Group {id} could not be found.</Trans> : <Trans>Channel {id} could not be found.</Trans>
            }
            search={{
                text: <Trans>Search {id}</Trans>,
                searchText: id,
                searchType: SearchType.Clubs,
                source: socialSource,
            }}
        />
    );
}
