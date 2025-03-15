import { t } from '@lingui/core/macro';
import bs58 from 'bs58';
import { first } from 'lodash-es';
import { useCallback, useState } from 'react';
import { useAsyncFn } from 'react-use';
import { type Address } from 'viem';

import { SelectNetworkModalUI } from '@/components/SelectNetworkModalUI.js';
import { config } from '@/configs/wagmiClient.js';
import { NetworkType } from '@/constants/enum.js';
import { FetchError } from '@/constants/error.js';
import { EMPTY_LIST } from '@/constants/index.js';
import { enqueueMessageFromError, enqueueSuccessMessage, enqueueWarningMessage } from '@/helpers/enqueueMessage.js';
import { formatAddress } from '@/helpers/formatAddress.js';
import { getWalletClientRequired } from '@/helpers/getWalletClientRequired.js';
import { isSameAddress } from '@/helpers/isSameAddress.js';
import { resolveValue } from '@/helpers/resolveValue.js';
import { useSingletonModal } from '@/hooks/useSingletonModal.js';
import type { SingletonModalRefCreator } from '@/libs/SingletonModal.js';
import { MyWalletsModalRef } from '@/modals/controls.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import { getWalletAdaptorRequired, WalletNotConnectedError } from '@/providers/solana/getWalletAdapter.js';
import type { BindWalletResponse, FireflyWalletConnection } from '@/providers/types/Firefly.js';

export interface AddWalletModalProps {
    connections: FireflyWalletConnection[];
}

export interface AddWalletModalCloseProps {
    response?: BindWalletResponse['data'];
}
type Props = {
    ref: React.Ref<SingletonModalRefCreator<AddWalletModalProps, AddWalletModalCloseProps>>;
};

export function AddWalletModal({ ref }: Props) {
    const [{ connections }, setProps] = useState<AddWalletModalProps>({
        connections: EMPTY_LIST,
    });
    const [open, dispatch] = useSingletonModal(ref, {
        onOpen: (props) => {
            setProps(props);
        },
        onClose: () => setProps({ connections: EMPTY_LIST }),
    });
    const onClose = useCallback((props: AddWalletModalCloseProps = {}) => dispatch?.close(props), [dispatch]);

    const [{ loading }, onBind] = useAsyncFn(
        async (network: NetworkType) => {
            function checkExistedConnection(address: string) {
                const existedConnection = connections.find((connection) => isSameAddress(connection.address, address));
                if (existedConnection) {
                    MyWalletsModalRef.open();
                    const addressName = first(existedConnection.ens) || formatAddress(address, 8);
                    enqueueWarningMessage(t`${addressName} is already connected.`);
                    dispatch?.abort?.(new Error(`Already connected address name = ${addressName}.`));
                    return true;
                }
                return false;
            }

            try {
                const result = await resolveValue(async () => {
                    switch (network) {
                        case NetworkType.Ethereum: {
                            const walletClient = await getWalletClientRequired(config);
                            const address = walletClient.account.address;
                            if (checkExistedConnection(address)) return;
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
                            const adapter = await getWalletAdaptorRequired();
                            const address = adapter.publicKey.toBase58();
                            if (checkExistedConnection(address)) return;
                            const hexMessage =
                                await FireflyEndpointProvider.getMessageToSignMessageForBindSolanaWallet(address);
                            const message = bs58.decode(bs58.encode(Buffer.from(hexMessage.substring(2), 'hex')));
                            const signature = Buffer.from(await adapter.signMessage(message)).toString('hex');
                            return FireflyEndpointProvider.verifyAndBindSolanaWallet(address, hexMessage, signature);
                        }
                        default:
                            throw new WalletNotConnectedError();
                    }
                });
                if (!result) {
                    dispatch?.abort?.(new Error('This address type is not supported'));
                    return;
                }
                enqueueSuccessMessage(t`Wallet added successfully`);
                onClose({ response: result });
            } catch (error) {
                if (
                    error instanceof Error &&
                    error.message.includes('This wallet already bound to the other account')
                ) {
                    enqueueWarningMessage(
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
        },
        [connections, dispatch, onClose],
    );

    return (
        <SelectNetworkModalUI
            onOpen={onBind}
            open={open}
            onClose={() => dispatch?.abort?.(new Error(`User reject`))}
            loading={loading}
        />
    );
}
