import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { rootRouteId, useRouteContext } from '@tanstack/react-router';
import { isUndefined } from 'lodash-es';
import { useState } from 'react';
import { useAccount } from 'wagmi';

import { ClickableArea } from '@/components/ClickableArea.js';
import { ClickableButton } from '@/components/ClickableButton.js';
import { ScannableQRCode } from '@/components/ScannableQRCode.js';
import { wagmiConfig } from '@/configs/wagmiClient.js';
import { classNames } from '@/helpers/classNames.js';
import { getPrivyWalletClientRequired } from '@/helpers/getPrivyWalletClientRequired.js';
import { useAbortController } from '@/hooks/useAbortController.js';
import { InfoCard } from '@/modals/FrameViewerModal/InfoCard.js';
import { LoadingCard } from '@/modals/FrameViewerModal/LoadingCard.js';
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

    const account = useAccount();
    const [isScanned, setIsScanned] = useState(false);

    // Check if the current wallet is registered
    const { isLoading, isRefetching, isError, data, refetch } = useQuery({
        queryKey: ['auth-wallet-status', fid, account.address],
        queryFn: async () => {
            setIsScanned(false);
            controller.current.renew();

            const client = await getPrivyWalletClientRequired(wagmiConfig);
            const result = await keyDataOf(fid, client.account.address);

            // the address key has already registered
            if (result.state === 1 && result.keyType === 2) return null;

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

            return key;
        },
        enabled: !!fid,
    });

    const { isError: signError, refetch: sign } = useQuery({
        queryKey: ['auth-wallet-sign-in', data?.token, fid, frame, options],
        enabled: !isLoading && !isRefetching && !isUndefined(data),
        queryFn: async () => {
            if (isUndefined(data)) return;

            if (data?.token) {
                await pollingSignerRequestToken(data.token, controller.current.signal);
                setIsScanned(true);
            }

            const signed = await signInWithAuthWallet(frame, `${fid}`, options);

            captureFrameSignInEvent('auth-wallet', frame);

            onClose(signed);
        },
    });

    return (
        <div className="relative flex flex-col items-center justify-center gap-2 py-2">
            {isLoading || isRefetching ? (
                <LoadingCard description={<Trans>Checking wallet status...</Trans>} />
            ) : isError ? (
                <InfoCard
                    title={<Trans>Authentication Failed</Trans>}
                    description={<Trans>Something went wrong, please try again.</Trans>}
                >
                    <ClickableButton
                        className="mt-6 rounded-2xl bg-main p-2 px-4 font-bold text-primaryBottom outline-none"
                        onClick={() => {
                            refetch();
                            setIsScanned(false);
                        }}
                    >
                        <Trans>Retry</Trans>
                    </ClickableButton>
                </InfoCard>
            ) : isScanned || !data?.deeplinkUrl ? (
                <>
                    {signError ? (
                        <InfoCard
                            title={<Trans>Authentication Failed</Trans>}
                            description={<Trans>Failed to sign in with Firefly Wallet.</Trans>}
                        >
                            <ClickableButton
                                className="mt-6 rounded-2xl bg-main p-2 px-4 font-bold text-primaryBottom outline-none"
                                onClick={() => sign()}
                            >
                                <Trans>Retry</Trans>
                            </ClickableButton>
                        </InfoCard>
                    ) : (
                        <LoadingCard description={<Trans>Wait for signing...</Trans>} />
                    )}
                </>
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
                            url={data.deeplinkUrl}
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
