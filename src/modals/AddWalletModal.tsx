import { t } from '@lingui/core/macro';
import { first } from 'lodash-es';
import { useCallback, useState } from 'react';
import { useAsyncFn } from 'react-use';

import { SelectNetworkModalUI } from '@/components/SelectNetworkModalUI.js';
import { NetworkType } from '@/constants/enum.js';
import { FetchError } from '@/constants/error.js';
import { EMPTY_LIST } from '@/constants/index.js';
import { enqueueMessageFromError, enqueueSuccessMessage, enqueueWarningMessage } from '@/helpers/enqueueMessage.js';
import { formatAddress } from '@/helpers/formatAddress.js';
import { isSameAddress } from '@/helpers/isSameAddress.js';
import { useSingletonModal } from '@/hooks/useSingletonModal.js';
import type { SingletonModalRefCreator } from '@/libs/SingletonModal.js';
import { MyWalletsModalRef } from '@/modals/controls.js';
import type { BindWalletResponse, FireflyWalletConnection } from '@/providers/types/Firefly.js';
import { verifyAndBindWallet } from '@/services/verifyAndBindWallet.js';

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
            try {
                const result = await verifyAndBindWallet(network, (address: string) => {
                    const existedConnection = connections.find((connection) =>
                        isSameAddress(connection.address, address),
                    );
                    if (!existedConnection) return false;

                    MyWalletsModalRef.open();
                    const addressName = first(existedConnection.ens) || formatAddress(address, 8);
                    enqueueWarningMessage(t`${addressName} is already connected.`);
                    dispatch?.abort?.(new Error(`Already connected address name = ${addressName}.`));
                    return true;
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
