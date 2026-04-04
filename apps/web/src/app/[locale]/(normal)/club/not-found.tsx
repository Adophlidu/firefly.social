'use client';

import { Trans } from '@lingui/react/macro';

import NotFound from '@/components/NotFound.js';

export default function ChannelNotFound() {
    return <NotFound backText={<Trans>Club details</Trans>} text={<Trans>Club could not be found.</Trans>} />;
}
