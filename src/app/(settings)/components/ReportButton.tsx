import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { useAsyncFn } from 'react-use';

import { waitForSelectReportReason } from '@/app/(settings)/components/waitForSelectReportReason.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { enqueueMessageFromError, enqueueSuccessMessage } from '@/helpers/enqueueMessage.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import type { FireflyWalletConnection } from '@/providers/types/Firefly.js';

interface ReportButtonProps {
    connection: FireflyWalletConnection;
}

export function ReportButton({ connection }: ReportButtonProps) {
    const [{ loading }, handleReport] = useAsyncFn(async () => {
        try {
            const reason = await waitForSelectReportReason();
            if (!reason) return;

            await FireflyEndpointProvider.reportAndDeleteWallet(connection, reason);
            enqueueSuccessMessage(t`Disconnected from your social graph`);
        } catch (error) {
            enqueueMessageFromError(error, t`Failed to disconnect`);
            throw error;
        }
    }, [connection]);

    if (loading) {
        return <LoadingIcon size={20} />;
    }

    return (
        <span className="cursor-pointer font-bold text-danger" onClick={handleReport}>
            <Trans>Report</Trans>
        </span>
    );
}
