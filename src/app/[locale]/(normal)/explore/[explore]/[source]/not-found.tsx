'use client';

import { Trans } from '@lingui/react/macro';

import NotFound from '@/components/NotFound.js';

export default function PostNotFound() {
    return <NotFound text={<Trans>Page not found</Trans>} />;
}
