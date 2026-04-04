'use client';

import { Trans } from '@lingui/react/macro';

import NotFound from '@/components/NotFound.js';
import { SearchType } from '@/constants/enum.js';

export default function PostNotFound() {
    return (
        <NotFound
            backText={<Trans>Post details</Trans>}
            text={<Trans>Post could not be found.</Trans>}
            search={{ text: <Trans>Search post</Trans>, searchText: '', searchType: SearchType.Posts }}
        />
    );
}
