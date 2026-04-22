'use client';

import { Trans } from '@lingui/react/macro';

import { NotFound } from '@/components/NotFound.js';

export default function PolymarketEventNotFound() {
    return <NotFound text={<Trans>No polymarket event found.</Trans>} />;
}
