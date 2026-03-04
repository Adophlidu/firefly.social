'use client';

import { UnauthorizedError } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { useEffect } from 'react';

import NotFound from '@/components/NotFound.js';
import { SearchType } from '@/constants/enum.js';
import { TweetUnavailableError } from '@/constants/error.js';
import { enqueueWarningMessage } from '@/helpers/enqueueMessage.js';

export default function Error({ error }: { error: Error }) {
    useEffect(() => {
        if (error instanceof TweetUnavailableError && error.message) {
            enqueueWarningMessage(error.message);
        }
    }, [error]);

    if (error instanceof TweetUnavailableError || error instanceof UnauthorizedError) {
        return (
            <NotFound
                text={<Trans>Post could not be found.</Trans>}
                search={{ text: <Trans>Search post</Trans>, searchText: '', searchType: SearchType.Posts }}
            />
        );
    }

    throw error;
}
