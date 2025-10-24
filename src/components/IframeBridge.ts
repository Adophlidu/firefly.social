'use client';

import { memo, useEffect } from 'react';

import type { ProfileSource } from '@/constants/enum.js';
import {
    enqueueErrorMessage,
    enqueueInfoMessage,
    enqueueSuccessMessage,
    enqueueWarningMessage,
} from '@/helpers/enqueueMessage.js';
import { openLoginModal } from '@/helpers/openLoginModal.js';
import { safeUnreachable } from '@/helpers/unreachable.js';
import { ComposeModalRef } from '@/modals/ComposeModal.js';
import { iframeBridgeProvider } from '@/providers/iframe/IframeBridge.js';
import {
    IframeBridgeMethod,
    type IframeBridgeRequestArguments,
    type IframeBridgeResponseResult,
} from '@/providers/iframe/types.js';
import { openWindow } from '@/helpers/openWindow.js';
import { IS_MOBILE_DEVICE } from '@/constants/browser.js';

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
            : openWindow('https://5euxu.app.link/PHvNiyVemIb');
    },
};

export const IframeBridge = memo(function IframeBridge() {
    useEffect(() => {
        iframeBridgeProvider.onRequest((method, params) => allEvents[method](params));

        return () => iframeBridgeProvider.destroy();
    }, []);

    return null;
});
