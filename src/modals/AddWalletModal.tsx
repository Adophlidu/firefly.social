import { t } from '@lingui/core/macro';
import { unreachable } from '@masknet/kit';
import { useQueryClient } from '@tanstack/react-query';
import bs58 from 'bs58';
import { first } from 'lodash-es';
import { forwardRef, useCallback, useState } from 'react';
import type { Address } from 'viem';

import { config } from '@/configs/wagmiClient.js';
import { NetworkType } from '@/constants/enum.js';
import { FetchError } from '@/constants/error.js';
import { EMPTY_LIST } from '@/constants/index.js';
import { enqueueInfoMessage, enqueueMessageFromError, enqueueSuccessMessage } from '@/helpers/enqueueMessage.js';
import { formatAddress } from '@/helpers/formatAddress.js';
import { getAddressType } from '@/helpers/getAddressType.js';
import { getWalletClientRequired } from '@/helpers/getWalletClientRequired.js';
import { isSameAddress } from '@/helpers/isSameAddress.js';
import { useSingletonModal } from '@/hooks/useSingletonModal.js';
import { useSolanaWalletProvider } from '@/hooks/useSolanaWalletProvider.js';
import type { SingletonModalRefCreator } from '@/libs/SingletonModal.js';
import { AccountModalRef, ConnectModalRef } from '@/modals/controls.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import type { BindWalletResponse, FireflyWalletConnection } from '@/providers/types/Firefly.js';

export interface AddWalletModalProps {
    connections: FireflyWalletConnection[];
}

export interface AddWalletModalCloseProps {
    response?: BindWalletResponse['data'];
}

export const AddWalletModal = forwardRef<SingletonModalRefCreator<AddWalletModalProps, AddWalletModalCloseProps>>(
    function AddWalletModal(_, ref) {
        const walletProvider = useSolanaWalletProvider();
        const { publicKey, signMessage } = walletProvider || {};

        const [{ connections }, setProps] = useState<AddWalletModalProps>({
            connections: EMPTY_LIST,
        });
        const [, dispatch] = useSingletonModal(ref, {
            onOpen: (props) => {
                setProps(props);
                onBind();
            },
            onClose: () => setProps({ connections: EMPTY_LIST }),
        });
        const onClose = useCallback((props: AddWalletModalCloseProps = {}) => dispatch?.close(props), [dispatch]);

        const qc = useQueryClient();

        const onBind = useCallback(async () => {
            try {
                const walletClient = await getWalletClientRequired(config);
                const address = walletClient.account.address;

                const existedConnection = connections.find((connection) => isSameAddress(connection.address, address));
                if (existedConnection) {
                    AccountModalRef.open();

                    const addressName = first(existedConnection.ens) || formatAddress(address, 8);
                    enqueueInfoMessage(t`${addressName} is already connected.`);
                    dispatch?.abort?.(new Error(`Already connected address name = ${addressName}.`));
                    return;
                }

                async function callBindAddress(address: string) {
                    const addressType = getAddressType(address);
                    if (!addressType) throw new Error('This address type is not supported');
                    switch (addressType) {
                        case NetworkType.Ethereum: {
                            const message = await FireflyEndpointProvider.getMessageToSignForBindWallet(
                                address.toLowerCase(),
                            );
                            const signature = await walletClient.signMessage({
                                message: { raw: message },
                                account: address as Address,
                            });
                            return await FireflyEndpointProvider.verifyAndBindWallet(message, signature);
                        }
                        case NetworkType.Solana: {
                            if (!publicKey || !signMessage) {
                                ConnectModalRef.open();
                                return;
                            }
                            const hexMessage =
                                await FireflyEndpointProvider.getMessageToSignMessageForBindSolanaWallet(address);
                            const message = bs58.decode(bs58.encode(Buffer.from(hexMessage.substring(2), 'hex')));
                            const signature = Buffer.from(await signMessage(message)).toString('hex');
                            return FireflyEndpointProvider.verifyAndBindSolanaWallet(address, hexMessage, signature);
                        }
                        default:
                            unreachable(addressType);
                    }
                }

                const result = await callBindAddress(address);
                if (!result) {
                    dispatch?.abort?.(new Error('This address type is not supported'));
                    return;
                }
                await qc.refetchQueries({ queryKey: ['my-wallet-connections'] });
                enqueueSuccessMessage(t`Wallet added successfully`);
                onClose({ response: result });
            } catch (error) {
                if (
                    error instanceof Error &&
                    error.message.includes('This wallet already bound to the other account')
                ) {
                    enqueueInfoMessage(
                        t`Sorry, this wallet is already linked to another Firefly account. Please try a different one.`,
                    );
                    dispatch?.abort?.(error);
                    throw error;
                }

                const messageFromError = error instanceof FetchError ? error.text : '';
                enqueueMessageFromError(error, messageFromError || t`Failed to add wallet`);
                dispatch?.abort?.(new Error('Failed to add wallet'));
                throw error;
            }
        }, [connections, dispatch, onClose, publicKey, qc, signMessage]);

        return null;
    },
);
