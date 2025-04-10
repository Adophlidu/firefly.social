import { Trans } from '@lingui/react/macro';

import NotFound from '@/components/NotFound.js';
import { setupLocaleForSSR } from '@/i18n/index.js';

export default async function GroupNotFound() {
    await setupLocaleForSSR();

    return <NotFound backText={<Trans>Group</Trans>} text={<Trans>Group could not be found.</Trans>} />;
}
