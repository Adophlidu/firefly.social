import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router';
import { forwardRef, useRef } from 'react';
import urlcat from 'urlcat';

import { Modal } from '@/components/Modal.js';
import { Popover } from '@/components/Popover.js';
import { type FarcasterSignType, type ProfileSource } from '@/constants/enum.js';
import { resolveSourceInUrl } from '@/helpers/resolveSourceInUrl.js';
import { useIsMedium } from '@/hooks/useMediaQuery.js';
import { useSingletonModal } from '@/hooks/useSingletonModal.js';
import type { SingletonModalRefCreator } from '@/libs/SingletonModal.js';
import { MainView } from '@/modals/LoginModal/MainView.js';
import { routeTree } from '@/modals/LoginModal/routes.js';

interface LoginRouterOptions {
    initialEntries?: string[];
    initialIndex?: number;
}

const defaultLoginRouterOptions = {
    initialEntries: ['/main'],
    initialIndex: 0,
} satisfies LoginRouterOptions;

function createLoginRouter(options: LoginRouterOptions = defaultLoginRouterOptions) {
    const { initialEntries = defaultLoginRouterOptions.initialEntries, initialIndex = 0 } = options;
    const memoryHistory = createMemoryHistory({
        initialEntries,
        initialIndex,
    });

    const router = createRouter({
        routeTree,
        history: memoryHistory,
        defaultPendingMinMs: 0,
        defaultPendingComponent: MainView,
    });

    return router;
}

export interface LoginModalOpenProps {
    source?: ProfileSource;
    options?: {
        /**
         * profile id of expected profile.
         * The expected profile will be place at the top of the list.
         */
        expectedProfile?: string;
        /** open the farcaster login modal with the specified sign type */
        expectedSignType?: FarcasterSignType;
    };
}

export const LoginModal = forwardRef<SingletonModalRefCreator<LoginModalOpenProps | void>>(function LoginModal(_, ref) {
    const isMedium = useIsMedium();
    const routerRef = useRef(createLoginRouter());

    const [open, dispatch] = useSingletonModal(ref, {
        onOpen: (props) => {
            if (props?.source) {
                const initialEntries = ['/main', urlcat(`/${resolveSourceInUrl(props.source)}`, props.options ?? {})];
                routerRef.current = createLoginRouter({
                    initialEntries,
                    initialIndex: 1,
                });
            } else {
                routerRef.current = createLoginRouter();
                routerRef.current.history.replace('/main');
            }
        },
    });

    const Router = <RouterProvider router={routerRef.current} />;

    if (isMedium) {
        return (
            <Modal open={open} onClose={() => dispatch?.close()}>
                <div>{Router}</div>
            </Modal>
        );
    }

    return (
        <Popover open={open} onClose={() => dispatch?.close()} dialogPanelClassName="!p-0 !pt-6">
            {Router}
        </Popover>
    );
});
