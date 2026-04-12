'use client';

import MuteIcon from '@dimensiondev/assets/mute.svg';
import UnmuteIcon from '@dimensiondev/assets/unmute.svg';
import { Trans } from '@lingui/react/macro';
import { useMutation } from '@tanstack/react-query';
import type { Address } from 'viem';

import { MenuButton } from '@/components/Actions/MenuButton.js';
import type { ClickableButtonProps } from '@/components/ClickableButton.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { queryClient } from '@/configs/queryClient.js';
import { enqueueSuccessMessage } from '@/helpers/enqueueMessage.js';
import { openLoginModal } from '@/helpers/openLoginModal.js';
import { useIsLogin } from '@/hooks/useIsLogin.js';
import { ConfirmModalRef } from '@/modals/ConfirmModal/refs.js';
import { fireflyWalletProvider } from '@/providers/firefly/Wallet.js';
import { captureMuteEvent } from '@/providers/telemetry/captureMuteEvent.js';
import { EventId } from '@/providers/types/Telemetry.js';

interface Props extends Omit<ClickableButtonProps, 'children'> {
    handleOrEnsOrAddress: string;
    address: Address;
    isMuted?: boolean;
}

export function MuteWalletButton({ handleOrEnsOrAddress, address, isMuted, ref, onClick, ...rest }: Props) {
    const isLogin = useIsLogin();
    const mutation = useMutation({
        mutationFn: async () => {
            if (isMuted) {
                const result = await fireflyWalletProvider.unblockWallet(address);
                queryClient.setQueryData(['address-is-muted', address.toLowerCase()], false);
                captureMuteEvent(EventId.UNMUTE_SUCCESS, address);
                enqueueSuccessMessage(<Trans>Unmuted {handleOrEnsOrAddress}.</Trans>);
                return result;
            } else {
                const result = await fireflyWalletProvider.blockWallet(address);
                queryClient.setQueryData(['address-is-muted', address.toLowerCase()], true);
                enqueueSuccessMessage(<Trans>Muted {handleOrEnsOrAddress}.</Trans>);
                captureMuteEvent(EventId.MUTE_SUCCESS, address);
                return result;
            }
        },
    });
    return (
        <MenuButton
            {...rest}
            onClick={async (event) => {
                onClick?.(event);

                if (!isLogin) {
                    openLoginModal();
                    return;
                }
                if (!isMuted) {
                    const confirmed = await ConfirmModalRef.openAndWaitForClose({
                        title: <Trans>Mute {handleOrEnsOrAddress}</Trans>,
                        variant: 'normal',
                        content: (
                            <div className="text-main">
                                <Trans>All activities from {handleOrEnsOrAddress} will be hidden from you</Trans>
                            </div>
                        ),
                    });
                    if (!confirmed) return;
                }
                await mutation.mutateAsync();
            }}
            ref={ref}
        >
            {mutation.isPending ? (
                <LoadingIcon size={18} className="mx-1" />
            ) : isMuted ? (
                <UnmuteIcon width={18} height={18} />
            ) : (
                <MuteIcon width={18} height={18} />
            )}
            <span className="text-main font-bold leading-[22px]">
                {isMuted ? <Trans>Unmute {handleOrEnsOrAddress}</Trans> : <Trans>Mute {handleOrEnsOrAddress}</Trans>}
            </span>
        </MenuButton>
    );
}
