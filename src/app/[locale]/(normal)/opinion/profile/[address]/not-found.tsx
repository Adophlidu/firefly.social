'use client';

import { Trans } from '@lingui/react/macro';

import NotFound from '@/components/NotFound.js';

export default function OpinionNotFound() {
    return <NotFound text={<Trans>No opinion profile found.</Trans>} />;
}
