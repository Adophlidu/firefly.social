'use client';

import { Trans } from '@lingui/react/macro';

import NotFound from '@/components/NotFound.js';

export default function CollectionNotFound() {
    return <NotFound backText={<Trans>Collectible</Trans>} text={<Trans>Collectible could not be found.</Trans>} />;
}
