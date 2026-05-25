'use client';

import { classNames } from '@dimensiondev/utils';
import { createMemoryHistory, createRouter, RouterProvider, useRouterState } from '@tanstack/react-router';
import { type Ref, useRef } from 'react';

import { LoadingIcon } from '@/components/LoadingIcon.js';
import { Modal } from '@/components/Modal.js';
import { useSingletonModal } from '@/hooks/useSingletonModal.js';
import type { RedPacketModalRefType } from '@/modals/RedPacketModal/refs.js';
import { routeTree } from '@/modals/RedPacketModal/routes.js';

function PendingComponent() {
    const { location } = useRouterState();

    return (
        <div
            className={classNames(
                'flex min-w-[600px] transform-gpu items-center justify-center overflow-hidden rounded-xl bg-primaryBottom transition-all',
                location.pathname === '/main' ? 'min-h-[563px]' : 'min-h-[620px]',
            )}
        >
            <LoadingIcon />
        </div>
    );
}

function createRedPacketRouter(initialEntries: string[] = ['/main']) {
    const memoryHistory = createMemoryHistory({
        initialEntries,
    });

    return createRouter({
        routeTree,
        history: memoryHistory,
        defaultPendingMinMs: 200,
        defaultPendingComponent: PendingComponent,
    });
}

interface Props {
    ref: Ref<RedPacketModalRefType>;
}

export function RedPacketModal({ ref }: Props) {
    const routerRef = useRef(createRedPacketRouter());
    const [open, dispatch] = useSingletonModal(ref, {
        onOpen: async (props) => {
            const initialEntries = props?.initialPath ? [props.initialPath] : ['/main'];
            routerRef.current = createRedPacketRouter(initialEntries);
        },
    });

    const Router = <RouterProvider router={routerRef.current} />;

    return (
        <Modal open={open} onClose={() => dispatch?.close()}>
            <div>{Router}</div>
        </Modal>
    );
}
