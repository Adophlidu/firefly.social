'use client';

import { Trans } from '@lingui/react/macro';

import NotFound from '@/components/NotFound.js';

export default function ProfileNotFound() {
    return <NotFound backText={<Trans>Profile details</Trans>} text={<Trans>Profile could not be found.</Trans>} />;
}
