import { Trans } from '@lingui/react/macro';

import NotFound from '@/components/NotFound.js';
import { setupLocaleForSSR } from '@/i18n/index.js';

export default async function ChannelNotFound() {
    await setupLocaleForSSR();

    return <NotFound backText={<Trans>Channel details</Trans>} text={<Trans>Channel could not be found.</Trans>} />;
}
