import { Trans } from '@lingui/react/macro';

import NotFound from '@/components/NotFound.js';
import { setupLocaleForSSR } from '@/i18n/index.js';

export default async function PolymarketEventNotFound() {
    await setupLocaleForSSR();

    return <NotFound text={<Trans>No polymarket event found.</Trans>} />;
}
