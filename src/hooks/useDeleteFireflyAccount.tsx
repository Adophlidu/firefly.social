import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { delay } from '@masknet/kit';
import { useRouter } from 'next/navigation.js';
import { useAsyncFn } from 'react-use';

import { enqueueMessageFromError, enqueueSuccessMessage } from '@/helpers/enqueueMessage.js';
import { ConfirmModalRef } from '@/modals/controls.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import { removeAllAccounts } from '@/services/account.js';

export function useDeleteFireflyAccount() {
    const router = useRouter();
    return useAsyncFn(async () => {
        const confirmed = await ConfirmModalRef.openAndWaitForClose({
            title: t`Delete Firefly account?`,
            variant: 'danger',
            content: (
                <p>
                    <Trans>
                        After deletion, all your social accounts and wallets will be disconnected.{' '}
                        <span className="font-bold text-danger">
                            Assets in the Firefly wallets can not be retrieved any more.
                        </span>{' '}
                        Please confirm again that you want to delete.
                    </Trans>
                </p>
            ),
        });
        if (!confirmed) return;
        try {
            await FireflyEndpointProvider.deleteAccount();
            enqueueSuccessMessage(t`Deleted your Firefly account`);
            await removeAllAccounts();
            await delay(300);
            router.replace(
                '/',
                {},
                {
                    showProgressBar: false,
                },
            );
        } catch (error) {
            enqueueMessageFromError(error, t`Failed to delete`);
        }
    }, [router]);
}
