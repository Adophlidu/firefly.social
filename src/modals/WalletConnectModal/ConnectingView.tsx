import { CoreChainController } from '@reown/appkit';
import { useEffect } from 'react';

import { ConnectModalRef } from '@/modals/controls.js';

export function ConnectingView() {
    useEffect(
        () =>
            CoreChainController.subscribeKey('activeCaipAddress', (address) => {
                if (address) {
                    ConnectModalRef.close();
                }
            }),
        [],
    );

    return <w3m-connecting-external-view />;
}
