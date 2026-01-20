'use client';

import { safeUnreachable } from '@dimensiondev/utils';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { forwardRef } from 'react';

import EvmIcon from '@/assets/evm.svg';
import SolanaIcon from '@/assets/solana.svg';
import { ClickableButton } from '@/components/ClickableButton.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { ModalTitle } from '@/components/ModalTitle.js';
import { wagmiConfig } from '@/configs/wagmiClient.js';
import { ClickOrigin, NetworkType, Source } from '@/constants/enum.js';
import { WalletNotConnectedError } from '@/constants/error.js';
import { enqueueErrorMessage, enqueueSuccessMessage } from '@/helpers/enqueueMessage.js';
import { getSessionsFromStorageBySource } from '@/helpers/getSessionFromStorage.js';
import { getWalletClientRequired } from '@/helpers/getWalletClientRequired.js';
import { isSameAddress } from '@/helpers/isSameAddress.js';
import { isValidAddressEthereum, isValidAddressSolana } from '@/helpers/isValidAddress.js';
import { updateCacheAfterAdd, updateCacheAfterDelete } from '@/helpers/updateVerifiedAddressesCache.js';
import { WalletItem } from '@/modals/VerifiedAddressModal/WalletItem.js';
import { WalletConnectModalRef } from '@/modals/WalletConnectModal/index.js';
import { deleteVerifiedAddress } from '@/providers/farcaster/deleteVerifiedAddress.js';
import type { FarcasterSession } from '@/providers/farcaster/Session.js';
import { verifyEthereumAddress, verifySolanaAddress } from '@/providers/farcaster/verifyAddress.js';
import { getVerifiedAddresses } from '@/providers/firefly/endpoint/getVerifiedAddresses.js';
import { getWalletAdaptorRequired } from '@/providers/solana/getWalletAdapter.js';
import { getWagmiCurrentConnectionId } from '@/helpers/getWagmiCurrentConnectionId.js';
import { PRIVY_CONNECTOR_ID } from '@/connectors/PrivyConnector.js';
import { getAccount, getConnections } from 'wagmi/actions';

export interface VerifiedAddressModalProps {
    fid?: string;
}

interface VerifiedAddress {
    address: string;
    name?: string;
}

function categorizeAddresses(connectedAddresses: string[] | undefined): {
    evm: VerifiedAddress[];
    solana: VerifiedAddress[];
} {
    const addresses = { evm: [] as VerifiedAddress[], solana: [] as VerifiedAddress[] };

    connectedAddresses?.forEach((address) => {
        if (isValidAddressEthereum(address)) {
            addresses.evm.push({ address });
        } else if (isValidAddressSolana(address)) {
            addresses.solana.push({ address });
        }
    });

    return addresses;
}

interface VerifiedAddressModalContentProps {
    fid?: string;
    onClose: () => void;
}

export const VerifiedAddressModalContent = forwardRef<HTMLDivElement, VerifiedAddressModalContentProps>(
    function VerifiedAddressModalContent({ fid, onClose }, ref) {
        const queryClient = useQueryClient();

        const { data, isLoading } = useQuery({
            queryKey: ['verifiedAddresses'],
            queryFn: () => getVerifiedAddresses(),
        });

        const deleteMutation = useMutation({
            mutationFn: deleteVerifiedAddress,
            onSuccess: (_data, { address }) => {
                updateCacheAfterDelete(queryClient, address);
                enqueueSuccessMessage(<Trans>Address removed on Farcaster</Trans>);
            },
            onError: (error: Error) => {
                enqueueErrorMessage(<Trans>Failed to remove address: {error.message}</Trans>);
            },
        });

        const handleDisconnect = (address: string) => {
            const session = getSessionsFromStorageBySource(Source.Farcaster).find((x) => x.profileId === fid) as
                | FarcasterSession
                | undefined;

            deleteMutation.mutate({
                address,
                session,
            });
        };

        const farcasterConnection = fid
            ? data?.data?.farcaster?.connected?.find((conn) => conn.fid.toString() === fid)
            : undefined;

        const checkIfAlreadyVerified = (address: string): boolean => {
            return farcasterConnection?.connectedAddresses?.some((addr) => isSameAddress(addr, address)) ?? false;
        };

        const handleVerifyAddress = useMutation({
            mutationFn: async () => {
                if (!fid) throw new Error('FID is required for verification');

                const selectedWallet = await WalletConnectModalRef.openAndWaitForClose({
                    customTitle: t`Select Wallet`,
                });
                if (!selectedWallet) return null;

                const network = selectedWallet.networkType;

                switch (network) {
                    case NetworkType.Ethereum: {
                        const recentConnectionId = getWagmiCurrentConnectionId();

                        const connections = getConnections(wagmiConfig);

                        let targetConnector = connections.find(
                            (conn) =>
                                conn.connector.id === recentConnectionId || conn.connector.uid === recentConnectionId,
                        )?.connector;

                        if (!targetConnector) {
                            const account = getAccount(wagmiConfig);
                            targetConnector = account.connector;
                        }

                        // fallback to first non-privy
                        if (!targetConnector || targetConnector.id === PRIVY_CONNECTOR_ID) {
                            targetConnector = connections.find(
                                (conn) => conn.connector.id !== PRIVY_CONNECTOR_ID,
                            )?.connector;
                        }

                        if (!targetConnector) {
                            throw new WalletNotConnectedError();
                        }

                        const walletClient = await getWalletClientRequired(
                            wagmiConfig,
                            { connector: targetConnector },
                            { origin: ClickOrigin.Settings },
                        );
                        const addressToVerify = walletClient.account.address.toLowerCase();

                        if (checkIfAlreadyVerified(addressToVerify)) {
                            enqueueSuccessMessage(<Trans>This address is already verified</Trans>);
                            return null;
                        }

                        return verifyEthereumAddress(fid, addressToVerify as `0x${string}`);
                    }
                    case NetworkType.Solana: {
                        const adapter = await getWalletAdaptorRequired({
                            origin: ClickOrigin.Settings,
                        });
                        const addressToVerify = adapter.publicKey.toBase58();

                        if (checkIfAlreadyVerified(addressToVerify)) {
                            enqueueSuccessMessage(<Trans>This address is already verified</Trans>);
                            return null;
                        }

                        return verifySolanaAddress(fid);
                    }
                    default:
                        safeUnreachable(network);
                        throw new WalletNotConnectedError();
                }
            },
            onSuccess: (address) => {
                if (!address || !fid) return;

                updateCacheAfterAdd(queryClient, fid, address);
                enqueueSuccessMessage(<Trans>Address verified on Farcaster</Trans>);
            },
            onError: (error: Error) => {
                enqueueErrorMessage(<Trans>Failed to verify address: {error.message}</Trans>);
            },
        });

        const addresses = categorizeAddresses(farcasterConnection?.connectedAddresses);

        const walletSections = [
            {
                key: 'evm',
                icon: EvmIcon,
                title: <Trans>EVM wallets</Trans>,
                wallets: addresses.evm,
            },
            {
                key: 'solana',
                icon: SolanaIcon,
                title: <Trans>Solana wallets</Trans>,
                wallets: addresses.solana,
            },
        ];

        return (
            <div
                ref={ref}
                className="relative flex w-screen grow flex-col overflow-auto bg-primaryBottom shadow-popover transition-all md:h-auto md:max-h-[800px] md:w-[455px] md:rounded-xl lg:grow-0"
            >
                <ModalTitle title={<Trans>Verified addresses</Trans>} onClose={onClose} />
                <div className="flex flex-col gap-6 px-6 pb-6 pt-0">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <LoadingIcon size={24} />
                        </div>
                    ) : (
                        <div className="flex flex-col gap-6">
                            {walletSections.map(
                                (section) =>
                                    section.wallets.length > 0 && (
                                        <div key={section.key} className="flex flex-col gap-3">
                                            <div className="flex items-center gap-2">
                                                <section.icon width={18} height={18} />
                                                <span className="text-lg font-bold leading-[18px] text-main">
                                                    {section.title}
                                                </span>
                                            </div>
                                            <div className="flex flex-col gap-3">
                                                {section.wallets.map((wallet) => (
                                                    <WalletItem
                                                        key={wallet.address}
                                                        address={wallet.address}
                                                        isDeleting={
                                                            !!(
                                                                deleteMutation.isPending &&
                                                                isSameAddress(
                                                                    deleteMutation.variables.address,
                                                                    wallet.address,
                                                                )
                                                            )
                                                        }
                                                        onDisconnect={handleDisconnect}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    ),
                            )}

                            {!isLoading && addresses.evm.length === 0 && addresses.solana.length === 0 && (
                                <div className="py-8 text-center text-medium text-second">
                                    <Trans>No verified addresses found</Trans>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex justify-center">
                        <ClickableButton
                            type="button"
                            loading={handleVerifyAddress.isPending}
                            className="flex h-11 min-h-11 w-[200px] items-center justify-center gap-2 rounded-lg border border-main bg-transparent px-[18px] py-[11px] text-[15px] font-bold leading-[20px] text-main transition-colors hover:bg-main hover:text-lightBottom"
                            onClick={() => handleVerifyAddress.mutate()}
                        >
                            <Trans>Verify Address</Trans>
                        </ClickableButton>
                    </div>
                </div>
            </div>
        );
    },
);
