import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { rootRouteId, useRouteContext } from '@tanstack/react-router';
import { useState } from 'react';
import { useAsyncFn } from 'react-use';
import { useAccount } from 'wagmi';

import { ClickableArea } from '@/components/ClickableArea.js';
import { ClickableButton } from '@/components/ClickableButton.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { ScannableQRCode } from '@/components/ScannableQRCode.js';
import { wagmiConfig } from '@/configs/wagmiClient.js';
import { classNames } from '@/helpers/classNames.js';
import { getWalletClientRequired } from '@/helpers/getWalletClientRequired.js';
import { useAbortController } from '@/hooks/useAbortController.js';
import { InfoCard } from '@/modals/FrameViewerModal/InfoCard.js';
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

            return {
                key,
            };
        },
        enabled: !!fid,
    });

    const [{ loading: isSigning, error: signError }, sign] = useAsyncFn(async () => {
        if (data?.key?.token) {
            await pollingSignerRequestToken(data.key.token, controller.current.signal);
            setIsScanned(true);
        }

        const signed = await signInWithAuthWallet(frame, `${fid}`, options);

        captureFrameSignInEvent('auth-wallet', frame);

        onClose(signed);
    }, [data?.key?.token, fid, frame, options, onClose]);

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
            ) : isScanned || !data?.key?.deeplinkUrl ? (
                <>
                    {isSigning ? (
                        <div className="flex h-[232px] w-full items-center justify-center gap-2 px-4">
                            <LoadingIcon />
                            <p>
                                <Trans>Wait for signing...</Trans>
                            </p>
                        </div>
                    ) : signError ? (
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
                        <InfoCard
                            title={<Trans>Use Firefly Wallet</Trans>}
                            description={
                                <Trans>Click &quot;Approve&quot; below to sign this miniapp with Firefly Wallet.</Trans>
                            }
                        >
                            <ClickableButton
                                className="mt-6 rounded-2xl bg-main p-2 px-4 font-bold text-primaryBottom outline-none"
                                onClick={() => sign()}
                            >
                                <Trans>Approve</Trans>
                            </ClickableButton>
                        </InfoCard>
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
