import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { rootRouteId, useRouteContext } from '@tanstack/react-router';
import { useState } from 'react';

import { ClickableArea } from '@/components/ClickableArea.js';
import { ClickableButton } from '@/components/ClickableButton.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { ScannableQRCode } from '@/components/ScannableQRCode.js';
import { wagmiConfig } from '@/configs/wagmiClient.js';
import { classNames } from '@/helpers/classNames.js';
import { getWalletClientRequired } from '@/helpers/getWalletClientRequired.js';
import { useAbortController } from '@/hooks/useAbortController.js';
import type { RelayConfirmationContext } from '@/modals/FrameViewerModal/RelayConfirmationRouter.js';
import { captureFrameSignInEvent } from '@/providers/telemetry/captureFrameSignInEvent.js';
import { createSignedKey } from '@/providers/warpcast/createSignedKey.js';
import { createSignedKeyPayloadWithAddressVerification } from '@/providers/warpcast/createSignedKeyPayload.js';
import { keyDataOf } from '@/providers/warpcast/keyDataOf.js';
import { pollingSignerRequestToken } from '@/providers/warpcast/pollingSignerRequestToken.js';
import { signInWithAuthWallet } from '@/providers/warpcast/signInWithFarcaster.js';

export function AuthWalletSignIn() {
    const controller = useAbortController();
    const context = useRouteContext({ from: rootRouteId });
    const { fid, frame, options, onClose } = context as RelayConfirmationContext;

    const [isScanned, setIsScanned] = useState(false);

    // Check if the current wallet is registered
    const { isLoading, isRefetching, isError, error, data, refetch } = useQuery({
        queryKey: ['auth-wallet-status', fid],
        queryFn: async () => {
            setIsScanned(false);
            controller.current.renew();

            const client = await getWalletClientRequired(wagmiConfig);
            const result = await keyDataOf(fid, client.account.address);

            // the address key has already registered
            if (result.state === 1 && result.keyType === 2) return {};

            const response = await createSignedKeyPayloadWithAddressVerification(
                client.account.address,
                controller.current.signal,
            );
            const key = await createSignedKey(
                {
                    ...response.body,
                    keyType: 'auth-address',
                },
                controller.current.signal,
            );

            console.log('Key:', {
                key,
                response,
            });

            return {
                key,
            };
        },
        enabled: !!fid,
    });

    useQuery({
        queryKey: ['auth-wallet-sign', data?.key],
        queryFn: async () => {
            if (data?.key?.token) {
                await pollingSignerRequestToken(data.key.token, controller.current.signal);
                setIsScanned(true);
            }

            const signed = await signInWithAuthWallet(frame, `${fid}`, options);
            console.log(`[AuthWalletSignIn] signed`, signed);

            captureFrameSignInEvent('auth-wallet', frame);

            onClose(signed);
        },
        enabled: !!data,
    });

    return (
        <div className="relative flex flex-col items-center justify-center gap-2 py-2">
            {isLoading || isRefetching ? (
                <div className="flex h-[232px] w-full items-center justify-center gap-2 px-4">
                    <LoadingIcon />
                    <p>
                        <Trans>Checking wallet status...</Trans>
                    </p>
                </div>
            ) : isError ? (
                <div className="flex h-[232px] w-full flex-col justify-center gap-2 px-4">
                    <p>
                        <Trans>Something went wrong, please try again.</Trans>
                    </p>
                    <ClickableButton
                        className="mt-2"
                        onClick={() => {
                            refetch();
                            setIsScanned(false);
                        }}
                    >
                        <Trans>Retry</Trans>
                    </ClickableButton>
                </div>
            ) : isScanned || !data?.key?.deeplinkUrl ? (
                <div className="flex h-[232px] w-full items-center justify-center gap-2 px-4">
                    <LoadingIcon />
                    <p>
                        <Trans>Wait for signing...</Trans>
                    </p>
                </div>
            ) : (
                <>
                    <ClickableArea
                        className={classNames('overflow-hidden rounded-2xl bg-white', {
                            'cursor-pointer': !isLoading,
                        })}
                        disabled={isLoading}
                        onClick={() => {
                            refetch();
                            setIsScanned(false);
                        }}
                    >
                        <ScannableQRCode
                            url={data.key.deeplinkUrl}
                            scanned={isScanned}
                            countdown={isScanned ? 0 : Number.POSITIVE_INFINITY}
                            size={200}
                            iconSize={60}
                        />
                    </ClickableArea>

                    <div className="mt-3 px-6 text-xs">
                        <Trans>
                            Scan this QR code and confirm on your Farcaster mobile app to register auth wallet.
                        </Trans>
                    </div>
                </>
            )}
        </div>
    );
}
