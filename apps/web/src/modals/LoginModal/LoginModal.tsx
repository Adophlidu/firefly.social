import { Source } from '@dimensiondev/enums';
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router';
import { type Ref, useRef, useState } from 'react';
import urlcat from 'urlcat';

import { Modal } from '@/components/Modal.js';
import { LensSignType } from '@/constants/enum.js';
import { resolveSourceInUrl } from '@/helpers/resolveSourceInUrl.js';
import { useIsLoginFirefly } from '@/hooks/useIsLoginFirefly.js';
import { useIsMedium } from '@/hooks/useMediaQuery.js';
import { useSingletonModal } from '@/hooks/useSingletonModal.js';
import { MainView } from '@/modals/LoginModal/MainView.js';
import type { LoginModalOpenProps, LoginModalRefType } from '@/modals/LoginModal/refs.js';
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

interface Props {
    ref: Ref<LoginModalRefType>;
}

export function LoginModal({ ref }: Props) {
    const isMedium = useIsMedium();
    const routerRef = useRef(createLoginRouter());
    const isLoginFirefly = useIsLoginFirefly();
    const [props, setProps] = useState<LoginModalOpenProps | null>(null);

    const [open, dispatch] = useSingletonModal(ref, {
        onOpen: (props) => {
            setProps(props || null);
            if (props?.source) {
                const initialEntries = [
                    '/main',
                    props.source === Source.Lens && props.options?.expectedLensSignType === LensSignType.OrbScan
                        ? '/orb'
                        : urlcat(`/${resolveSourceInUrl(props.source)}`, props.options ?? {}),
                ];
                routerRef.current = createLoginRouter({
                    initialEntries,
                    initialIndex: 1,
                });
            } else {
                routerRef.current = createLoginRouter();
                routerRef.current.history.replace(urlcat('/main', { isLogin: isLoginFirefly }));
            }
        },
        onClose: () => {
            setProps(null);
        },
    });

    const Router = <RouterProvider router={routerRef.current} context={{ props }} />;

    return (
        <Modal open={open} onClose={() => dispatch?.close()} enableBackdrop={isMedium}>
            <div className="max-md:h-screen max-md:w-screen">{Router}</div>
        </Modal>
    );
}
