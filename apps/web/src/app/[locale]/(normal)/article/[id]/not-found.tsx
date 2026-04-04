'use client';

import { Trans } from '@lingui/react/macro';

import NotFound from '@/components/NotFound.js';
import { SearchType } from '@/constants/enum.js';

export default function ArticleNotFound() {
    return (
        <NotFound
            backText={<Trans>Article</Trans>}
            text={<Trans>Article could not be found</Trans>}
            search={{ text: <Trans>Search article</Trans>, searchText: '', searchType: SearchType.Posts }}
        />
    );
}
