'use client';

import {
    IframeBridgeMethod,
    iframeBridgeProvider,
    type IframeBridgeRequestArguments,
    type IframeBridgeResponseResult,
} from '@dimensiondev/iframe-bridge';
import { safeUnreachable } from '@dimensiondev/utils';
import { memo, useEffect } from 'react';

import { IS_MOBILE_DEVICE } from '@/constants/browser.js';
import type { ProfileSource } from '@/constants/enum.js';
import { NotImplementedError } from '@/constants/error.js';
import {
    enqueueErrorMessage,
    enqueueInfoMessage,
    enqueueSuccessMessage,
    enqueueWarningMessage,
} from '@/helpers/enqueueMessage.js';
import { openLoginModal } from '@/helpers/openLoginModal.js';
import { ComposeModalRef } from '@/modals/ComposeModal.js';
import { DownloadMobileAppModalRef } from '@/modals/DownloadMobileAppModal/index.js';
import { useFireflyWalletStore } from '@/store/useFireflyWalletStore.js';

const allEvents: {
    [K in IframeBridgeMethod]: (params: IframeBridgeRequestArguments[K]) => Promise<IframeBridgeResponseResult[K]>;
} = {
    [IframeBridgeMethod.LOGIN]: async (params: IframeBridgeRequestArguments[IframeBridgeMethod.LOGIN]) => {
        openLoginModal(
            {
                source: params.source as ProfileSource | undefined,
            },
            params.forceOpen,
        );
    },
    [IframeBridgeMethod.COMPOSE]: async (params: IframeBridgeRequestArguments[IframeBridgeMethod.COMPOSE]) => {
        ComposeModalRef.open({
            type: 'compose',
            chars: params.text,
        });
    },
    [IframeBridgeMethod.ENQUEUE_MESSAGE]: async (
        params: IframeBridgeRequestArguments[IframeBridgeMethod.ENQUEUE_MESSAGE],
    ) => {
        switch (params.type) {
            case 'success':
                enqueueSuccessMessage(params.message, { duration: params.duration });
                break;
            case 'error':
                enqueueErrorMessage(params.message, { duration: params.duration });
                break;
            case 'info':
                enqueueInfoMessage(params.message, { duration: params.duration });
                break;
            case 'warning':
                enqueueWarningMessage(params.message, { duration: params.duration });
                break;
            default:
                safeUnreachable(params.type);
                break;
        }
    },
    [IframeBridgeMethod.DOWNLOAD_APP]: async (
        params: IframeBridgeRequestArguments[IframeBridgeMethod.DOWNLOAD_APP],
    ) => {
        IS_MOBILE_DEVICE
            ? (window.location.href = 'https://5euxu.app.link/PHvNiyVemIb')
            : DownloadMobileAppModalRef.open();
    },
    [IframeBridgeMethod.FIREFLY_WALLET_EVM_RPC]: async () => {
        throw new NotImplementedError();
    },
    [IframeBridgeMethod.FIREFLY_WALLET_SOLANA_RPC]: () => {
        throw new NotImplementedError();
    },
    [IframeBridgeMethod.FIREFLY_WALLET_AUTHORIZED]: async () => {
        useFireflyWalletStore.getState().setIsAuthorized(true);
    },
};

export const IframeBridge = memo(function IframeBridge() {
    useEffect(() => {
        iframeBridgeProvider.onRequest((method, params) => allEvents[method](params));

        return () => iframeBridgeProvider.destroy();
    }, []);

    return null;
});
