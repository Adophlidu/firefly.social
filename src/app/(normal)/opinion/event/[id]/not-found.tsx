import { Trans } from '@lingui/react/macro';

import NotFound from '@/components/NotFound.js';
import { setupLocaleForSSR } from '@/i18n/index.js';

export default async function OpinionEventNotFound() {
    await setupLocaleForSSR();

    return <NotFound text={<Trans>No opinion event found.</Trans>} />;
}
