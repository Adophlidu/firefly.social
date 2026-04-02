'use client';

import { Trans } from '@lingui/react/macro';

import NotFound from '@/components/NotFound.js';

export default function PolymarketNotFound() {
    return <NotFound text={<Trans>No polymarket profile found.</Trans>} />;
}
