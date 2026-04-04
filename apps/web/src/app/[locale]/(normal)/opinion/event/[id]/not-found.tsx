'use client';

import { Trans } from '@lingui/react/macro';

import NotFound from '@/components/NotFound.js';

export default function OpinionEventNotFound() {
    return <NotFound text={<Trans>No opinion event found.</Trans>} />;
}
