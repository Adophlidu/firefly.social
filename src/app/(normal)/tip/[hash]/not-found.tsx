'use client';

import { Trans } from '@lingui/react/macro';

import NotFound from '@/components/NotFound.js';
import { useParams } from '@/esm/navigation.js';

export default function NotFoundToken() {
    const params = useParams<{ hash: string }>();
    const hash = decodeURIComponent(params.hash);

    return <NotFound text={<Trans>Tip {hash} could not be found.</Trans>} />;
}
