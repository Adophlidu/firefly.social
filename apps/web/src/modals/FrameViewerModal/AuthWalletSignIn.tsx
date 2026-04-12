import { classNames, delay } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { rootRouteId, useRouteContext } from '@tanstack/react-router';
import { isUndefined } from 'lodash-es';
import { useState } from 'react';
import { useAsyncRetry } from 'react-use';
import { useConnection } from 'wagmi';

import { ClickableArea } from '@/components/ClickableArea.js';
import { ClickableButton } from '@/components/ClickableButton.js';
import { ScannableQRCode } from '@/components/ScannableQRCode.js';
import { ensureCreatedFireflyWallet } from '@/helpers/ensureCreatedFireflyWallet.js';
import { useAbortController } from '@/hooks/useAbortController.js';
import { logger } from '@/libs/Logger.js';
import { InfoCard } from '@/modals/FrameViewerModal/InfoCard.js';
import { LoadingCard } from '@/modals/FrameViewerModal/LoadingCard.js';
import type { RelayConfirmationContext } from '@/modals/FrameViewerModal/RelayConfirmationRouter.js';
import { ResultCard } from '@/modals/FrameViewerModal/ResultCard.js';
import { captureFrameSignInEvent } from '@/providers/telemetry/captureFrameSignInEvent.js';
import { createSignedKey } from '@/providers/warpcast/createSignedKey.js';
import { createSignedKeyPayloadWithAddressVerification } from '@/providers/warpcast/createSignedKeyPayload.js';
import { keyDataOf } from '@/providers/warpcast/keyDataOf.js';
import { pollingSignerRequestToken } from '@/providers/warpcast/pollingSignerRequestToken.js';
import { signInWithAuthWallet } from '@/providers/warpcast/signInWithAuthWallet.js';

export function AuthWalletSignIn() {
    const controller = useAbortController();
    const context = useRouteContext({ from: rootRouteId });
    const { fid, frame, options, onClose } = context as RelayConfirmationContext;

    const account = useConnection();
    const [isScanned, setIsScanned] = useState(false);
    const [isSigned, setIsSigned] = useState(false);

    // Check if the current wallet is registered
    const { isLoading, isRefetching, isError, data, refetch } = useQuery({
        queryKey: ['auth-wallet-status', fid, account.address?.toLowerCase()],
        queryFn: async () => {
            setIsScanned(false);
            controller.current.renew();

            const wallet = await ensureCreatedFireflyWallet();
            if (!wallet) throw new Error('Failed to ensure Firefly wallet');

            const result = await keyDataOf(fid, wallet.address as `0x${string}`);

            // the address key has already registered
            if (result.state === 1 && result.keyType === 2) return null;

            const response = await createSignedKeyPayloadWithAddressVerification(
                wallet.address as `0x${string}`,
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

    const { error: signError, retry: sign } = useAsyncRetry(async () => {
        if (isUndefined(data) || isRefetching || isLoading) return;

        if (data?.token) {
            await pollingSignerRequestToken(data?.token, controller.current.signal);
            setIsScanned(true);
        }

        const wallet = await ensureCreatedFireflyWallet();
        if (!wallet) throw new Error('Failed to ensure Firefly wallet');

        const signed = await signInWithAuthWallet(wallet.address as `0x${string}`, frame, `${fid}`, options);
        logger.info(
            `Success to sign in with address=${wallet.address}, message=${signed.message}, signature=${signed.signature}`,
        );

        setIsSigned(true);

        captureFrameSignInEvent('firefly-wallet', frame);

        // take a while to present the signed result
        await delay(2000);

        onClose(signed);
    }, [data, isRefetching, isLoading]);

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
                        className="bg-main text-primaryBottom mt-6 rounded-2xl p-2 px-4 font-bold outline-none"
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
                                className="bg-main text-primaryBottom mt-6 rounded-2xl p-2 px-4 font-bold outline-none"
                                onClick={() => sign()}
                            >
                                <Trans>Retry</Trans>
                            </ClickableButton>
                        </InfoCard>
                    ) : isSigned ? (
                        <ResultCard description={<Trans>Signed in successfully</Trans>} />
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
