'use client';

import { classNames } from '@dimensiondev/utils';
import { isSameAddress, isUserRejectErrorInWallet } from '@dimensiondev/web3/utils';
import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { rootRouteId, useMatch, useRouter } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { memo, useCallback } from 'react';
import { useAsyncFn } from 'react-use';
import { useConnection } from 'wagmi';

import { LoadingIcon } from '@/components/LoadingIcon.js';
import { EstimatedCost } from '@/components/Tips/EstimatedCost.js';
import { TipsRoutePath } from '@/components/Tips/TipsModalRouter.js';
import { NetworkType } from '@/constants/enum.js';
import { STALE_TIMES } from '@/constants/query.js';
import { enqueueMessageFromError, enqueueSuccessMessage } from '@/helpers/enqueueMessage.js';
import { isZero, ZERO } from '@/helpers/number.js';
import { resolveCurrentFireflyAccountId, resolveFireflyAccountId } from '@/helpers/resolveFireflyProfileId.js';
import { resolveNetworkProvider, resolveTransferProvider } from '@/helpers/resolveTokenTransfer.js';
import { trimify } from '@/helpers/trimify.js';
import { useSolanaWalletProvider } from '@/hooks/useSolanaWalletProvider.js';
import { WalletConnectModalRef } from '@/modals/WalletConnectModal/refs.js';
import { EventId } from '@/providers/types/Telemetry.js';
import { reportAndCaptureTipEvent } from '@/services/reportAndCaptureTipEvent.js';
import { useTipsStore } from '@/store/useTipsStore.js';

interface SendTipsButtonProps {
    connected: boolean;
    onConnect: () => void;
}

const SendTipsButton = memo<SendTipsButtonProps>(function SendTipsButton({ connected, onConnect }) {
    const router = useRouter();
    const { context } = useMatch({ from: rootRouteId });
    const {
        token,
        recipient,
        tokenAmount: amount,
        update,
        identity,
        amount: customAmount,
        showLoadingView,
        showFailedView,
    } = useTipsStore();

    const {
        data: value,
        isLoading,
        isRefetching,
        error,
    } = useQuery({
        staleTime: STALE_TIMES.MINUTE_2,

        queryKey: [
            'tips-validate',
            recipient?.networkType,
            recipient?.address?.toLowerCase(),
            token?.chainId,
            token?.id,
            amount,
        ],
        queryFn: async () => {
            if (token && !token.price && !amount) {
                return {
                    label: <Trans>Custom amount is required for this token</Trans>,
                    disabled: true,
                };
            }

            if (!recipient || !token || !trimify(amount) || isZero(trimify(amount))) {
                return { label: <Trans>Send</Trans>, disabled: true };
            }

            const transfer = resolveTransferProvider(recipient.networkType);
            const network = resolveNetworkProvider(recipient.networkType);

            if (isSameAddress(recipient.address, await network.getAccount())) {
                return { label: <Trans>Cannot send tip to yourself</Trans>, disabled: true };
            }

            const isBalanceValid = token.custom
                ? true
                : await transfer.validateBalance({
                      to: recipient.address,
                      token,
                      amount,
                  });
            if (!isBalanceValid) {
                return { label: <Trans>Insufficient Balance</Trans>, disabled: true };
            }

            // ! The calculation of gas fee is not accurate on Solana, such as the fee for creating ATA is not included.
            const { isValid, gas } =
                recipient.networkType === NetworkType.Solana
                    ? { isValid: true, gas: ZERO }
                    : await transfer.validateGas({
                          to: recipient.address,
                          token,
                          amount,
                      });
            if (isValid) return { label: <Trans>Send</Trans>, disabled: false, gas };
            return { label: <Trans>Insufficient Balance for Gas Fee</Trans>, disabled: true, gas };
        },
    });

    const isCustomAmount = !!customAmount;
    const [{ loading: isSending }, handleSendTips] = useAsyncFn(async () => {
        if (!connected) {
            onConnect();
            return;
        }

        try {
            if (!recipient || !token) return;

            update({ hash: null, isSending: true, hasError: false });
            const transfer = resolveTransferProvider(recipient.networkType);
            const network = resolveNetworkProvider(recipient.networkType);
            const hash = await transfer.transfer({
                to: recipient.address,
                token,
                amount,
            });

            const [fromAccountId, toAccountId] = await Promise.all([
                resolveCurrentFireflyAccountId(),
                resolveFireflyAccountId(identity),
            ]);
            const reportOptions = {
                eventId: EventId.TIPS_SEND_SUBMIT,
                fromAccountId,
                toAccountId,
                address: await network.getAccount(),
                recipient,
                token,
                amount,
                hash,
                isCustomAmount,
            } as const;
            await reportAndCaptureTipEvent(reportOptions);
            update({ hash });
            await transfer.waitForTransaction(hash, token.chainId);
            // skip awaiting for reporting success
            reportAndCaptureTipEvent({
                ...reportOptions,
                eventId: EventId.TIPS_SEND_SUCCESS,
            });

            enqueueSuccessMessage(<Trans>Tip sent successfully!</Trans>);
            router.navigate({ to: TipsRoutePath.SUCCESS });
            update({ isSending: false, hasError: false });
        } catch (error) {
            if (isUserRejectErrorInWallet(error)) return;

            update({ hasError: true, isSending: false, hash: null, error: error as Error });
            enqueueMessageFromError(error, <Trans>Failed to send tip.</Trans>);
            throw error;
        }
    }, [router, connected, onConnect, recipient, token, update, amount, identity, isCustomAmount]);

    const isValidating = isLoading || isRefetching;
    const disabled = !connected ? false : isValidating || isSending || !!value?.disabled;

    if (showLoadingView) {
        return (
            <motion.button
                className="bg-lightMain text-lightBottom dark:text-darkBottom mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-lg font-bold"
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                    context.onClose();
                }}
            >
                <Trans>Done</Trans>
            </motion.button>
        );
    }

    if (showFailedView) {
        return (
            <motion.button
                className="bg-lightMain text-lightBottom dark:text-darkBottom mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-lg font-bold"
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                    update({ hash: null, hasError: false });
                }}
            >
                <Trans>Try again</Trans>
            </motion.button>
        );
    }

    return (
        <>
            <EstimatedCost gas={value?.gas || ZERO} />
            <motion.button
                className={classNames(
                    'bg-lightMain text-lightBottom dark:text-darkBottom mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-lg font-bold',
                    disabled ? 'cursor-not-allowed opacity-50' : '',
                )}
                disabled={disabled}
                whileTap={{ scale: 0.98 }}
                onClick={handleSendTips}
            >
                {isValidating ? null : !connected ? (
                    <Trans>Connect Wallet</Trans>
                ) : isSending ? (
                    <Trans>Sending</Trans>
                ) : error ? (
                    <Trans>Send</Trans>
                ) : (
                    value?.label
                )}
                {isSending || isValidating ? <LoadingIcon size={20} /> : null}
            </motion.button>
        </>
    );
});

export function SendWithEVM() {
    const account = useConnection();
    const onConnect = useCallback(() => {
        WalletConnectModalRef.open({ networkType: NetworkType.Ethereum });
    }, []);

    return <SendTipsButton connected={account.isConnected} onConnect={onConnect} />;
}

export function SendWithSolana() {
    const provider = useSolanaWalletProvider();

    const onConnect = useCallback(() => {
        WalletConnectModalRef.open({ networkType: NetworkType.Solana });
    }, []);

    return <SendTipsButton connected={!!provider?.publicKey} onConnect={onConnect} />;
}
