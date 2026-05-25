'use client';

import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { useEffect } from 'react';
import { useAsyncFn } from 'react-use';
import { useCountdown } from 'usehooks-ts';

import { ClickableButton } from '@/components/ClickableButton.js';
import { useRouter } from '@/esm/navigation.js';
import { enqueueMessageFromError, enqueueSuccessMessage } from '@/helpers/enqueueMessage.js';
import { ConfirmModalRef } from '@/modals/ConfirmModal/refs.js';
import { deleteAccount } from '@/providers/firefly/auth/deleteAccount.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { captureAccountDeleteEvent } from '@/providers/telemetry/captureAccountEvent.js';
import { removeAllAccounts } from '@/services/account.js';

function CountdownButton() {
    const [count, { startCountdown }] = useCountdown({
        countStart: 10,
        countStop: 0,
        isIncrement: false,
        intervalMs: 1000,
    });
    useEffect(() => {
        startCountdown();
    }, [startCountdown]);
    return (
        <ClickableButton
            disabled={count > 0}
            onClick={() => ConfirmModalRef.close(true)}
            className={classNames(
                'flex flex-1 items-center justify-center overflow-hidden rounded-full bg-commonDanger py-2 font-bold text-white',
            )}
        >
            {count > 0 ? <Trans>{count}s</Trans> : <Trans>Confirm</Trans>}
        </ClickableButton>
    );
}

export function useDeleteFireflyAccount() {
    const router = useRouter();
    return useAsyncFn(async () => {
        const confirmed = await ConfirmModalRef.openAndWaitForClose({
            title: <Trans>Delete Firefly account?</Trans>,
            variant: 'danger',
            enableConfirmButton: false,
            contentClass: 'text-main text-left text-medium',
            resetSize: true,
            modalClass: 'max-w-[455px]',
            content: (
                <>
                    <div>
                        <p className="mb-4">
                            <Trans>
                                Deleting your account will permanently disconnect your linked social accounts and remove
                                your Firefly wallets.
                            </Trans>
                        </p>
                        <ul className="list-disc pl-4 text-sm font-normal leading-6">
                            <li className="mb-4">
                                <Trans>
                                    If you have multiple Firefly accounts created with different social logins, deleting
                                    this account will help you consolidate your social accounts into one. However, if
                                    you&#39;re trying to access a different Firefly wallet linked to another social
                                    account, consider switching accounts instead of deleting.
                                </Trans>
                            </li>
                            <li className="mb-4">
                                <Trans>
                                    <span className="font-bold text-danger">
                                        Any assets in this Firefly wallet will be permanently lost and cannot be
                                        recovered.
                                    </span>{' '}
                                    Before proceeding, please withdraw all funds and assets from your Firefly wallets to
                                    avoid any loss.
                                </Trans>
                            </li>
                        </ul>
                        <p>
                            <Trans>Are you sure you want to continue?</Trans>
                        </p>
                    </div>
                    <CountdownButton />
                </>
            ),
        });
        if (!confirmed) return;

        try {
            await deleteAccount();
            enqueueSuccessMessage(<Trans>Deleted your Firefly account</Trans>);
            router.replace('/', {
                showProgress: false,
                disableSameURL: true,
            });
            await captureAccountDeleteEvent(fireflySessionHolder.sessionRequired.accountIdForEvent);
            await removeAllAccounts();
        } catch (error) {
            enqueueMessageFromError(error, <Trans>Failed to delete</Trans>);
            throw error;
        }
    }, [router]);
}
