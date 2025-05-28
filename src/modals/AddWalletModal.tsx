import { useCallback, useState } from 'react';

import { SelectNetworkModalUI } from '@/components/SelectNetworkModalUI.js';
import { EMPTY_LIST } from '@/constants/index.js';
import { useSingletonModal } from '@/hooks/useSingletonModal.js';
import { useVerifyAndBindWallet } from '@/hooks/useVerifyAndBindWallet.js';
import type { SingletonModalRefCreator } from '@/libs/SingletonModal.js';
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

    const [{ loading }, onBind] = useVerifyAndBindWallet(
        connections,
        (result) => {
            onClose({ response: result });
        },
        (error) => {
            dispatch?.abort?.(error);
        },
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
