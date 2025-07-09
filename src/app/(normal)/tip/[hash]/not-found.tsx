import { Trans } from '@lingui/react/macro';

import NotFound from '@/components/NotFound.js';
import { setupLocaleForSSR } from '@/i18n/index.js';

export default async function NotFoundPage() {
    await setupLocaleForSSR();

    return <NotFound text={<Trans>The transaction could not be found.</Trans>} />;
}
