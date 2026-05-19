'use client';

import { SORTED_THIRD_PARTY_SOURCES } from '@dimensiondev/constants/computed';
import type { ThirdPartySource } from '@dimensiondev/enums';
import { classNames } from '@dimensiondev/utils';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { useState } from 'react';
import { useAsyncFn } from 'react-use';

import { ClickableButton } from '@/components/ClickableButton.js';
import { CloseButton } from '@/components/IconButton.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { ProfileInList } from '@/components/Login/ProfileInList.js';
import { Modal } from '@/components/Modal.js';
import { queryClient } from '@/configs/queryClient.js';
import { enqueueErrorMessage, enqueueMessageFromError, enqueueSuccessMessage } from '@/helpers/enqueueMessage.js';
import { resolveConnectionPlatform } from '@/helpers/resolveConnectionPlatform.js';
import { stopEvent } from '@/helpers/stopEvent.js';
import { useFireflyAccountAvatar } from '@/hooks/useFireflyAccountAvatar.js';
import { useSingletonModal } from '@/hooks/useSingletonModal.js';
import type {
    DisconnectFireflyAccountModalProps,
    DisconnectFireflyAccountModalRefType,
} from '@/modals/DisconnectFireflyAccountModal/refs.js';
import { disconnectAccount } from '@/providers/firefly/endpoint/disconnectAccount.js';
import { captureAccountDisconnectEvent } from '@/providers/telemetry/captureAccountEvent.js';
import { removeAccountByProfileId } from '@/services/account.js';

interface Props {
    ref: React.Ref<DisconnectFireflyAccountModalRefType>;
}

export function DisconnectFireflyAccountModal({ ref }: Props) {
    const [props, setProps] = useState<DisconnectFireflyAccountModalProps | void>();
    const account = props?.account;
    const avatar = useFireflyAccountAvatar();
    const [open, dispatch] = useSingletonModal(ref, {
        onOpen: (props) => setProps(props),
    });

    const [{ loading }, confirm] = useAsyncFn(async () => {
        try {
            if (!account) return;
            const source = account.profile.profileSource;
            await disconnectAccount(account.profile.profileId, resolveConnectionPlatform(source));
            await removeAccountByProfileId(source, account.profile.profileId);
            captureAccountDisconnectEvent(account);

            await queryClient.invalidateQueries({
                queryKey: ['allConnections'],
            });

            await queryClient.invalidateQueries({
                queryKey: ['profiles', source],
            });

            enqueueSuccessMessage(<Trans>Disconnected from your social graph</Trans>);
            dispatch?.close();
        } catch (error) {
            if (error instanceof Error && error.message.includes('Please leave at least 1 account')) {
                enqueueErrorMessage(
                    t`Failed to disconnect. Please leave at least 1 account or wallet address connected to keep your immersive experience in Firefly.`,
                    { error },
                );
            } else {
                enqueueMessageFromError(error, <Trans>Failed to disconnect.</Trans>);
            }
            throw error;
        }
    }, [account, dispatch]);

    const isThirdPartyAccount =
        !!account?.profile && SORTED_THIRD_PARTY_SOURCES.includes(account.profile.profileSource as ThirdPartySource);

    return (
        <Modal open={open} onClose={() => dispatch?.close()}>
            <div
                className="bg-bgModal shadow-popover relative w-[320px] max-w-[clamp(386px,90vw,95vw)] rounded-xl transition-all md:w-[355px] dark:text-gray-950"
                onClick={stopEvent}
            >
                <div className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-t-[12px] p-4">
                    <CloseButton onClick={() => dispatch?.close()} />
                    <div className="text-main shrink grow basis-0 text-center text-lg font-bold leading-snug">
                        <Trans>Disconnect</Trans>
                    </div>
                    <div className="relative size-6" />
                </div>

                <div className="flex flex-col gap-2 px-0 !pt-0 pb-6">
                    <div className="flex flex-col gap-2">
                        <div className="text-medium text-lightMain px-6 font-medium leading-normal">
                            {isThirdPartyAccount ? (
                                <Trans>Confirm to disconnect this account from Firefly’s social graph?</Trans>
                            ) : (
                                <Trans>
                                    Confirm to disconnect this account and related wallets from Firefly’s social graph?
                                </Trans>
                            )}
                        </div>
                        <menu className="flex flex-col gap-3 px-6 pb-3 pt-2">
                            {account ? (
                                <div className="border-line rounded-lg border px-3 py-2">
                                    <ProfileInList
                                        key={account.profile.profileId}
                                        selected
                                        selectable={false}
                                        profile={account.profile}
                                        profileAvatarProps={{
                                            enableSourceIcon: !isThirdPartyAccount,
                                            enableDefaultAvatar: true,
                                            fallbackUrl: avatar,
                                        }}
                                    />
                                </div>
                            ) : null}
                        </menu>
                    </div>
                    <ClickableButton
                        className={classNames(
                            'bg-commonDanger mx-6 flex h-10 min-h-10 flex-1 items-center justify-center rounded-full py-2 font-bold text-white',
                        )}
                        disabled={loading}
                        onClick={() => confirm()}
                    >
                        {loading ? <LoadingIcon size={20} /> : <Trans>Confirm</Trans>}
                    </ClickableButton>
                </div>
            </div>
        </Modal>
    );
}
