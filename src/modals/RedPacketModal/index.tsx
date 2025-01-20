'use client';

import { createMemoryHistory, createRouter, RouterProvider, useRouterState } from '@tanstack/react-router';
import { forwardRef, useRef } from 'react';

import { LoadingIcon } from '@/components/LoadingIcon.js';
import { Modal } from '@/components/Modal.js';
import { classNames } from '@/helpers/classNames.js';
import { useSingletonModal } from '@/hooks/useSingletonModal.js';
import type { SingletonModalRefCreator } from '@/libs/SingletonModal.js';
import { RedPacketProvider } from '@/modals/RedPacketModal/RedPacketContext.js';
import { routeTree } from '@/modals/RedPacketModal/routes.js';

function PendingComponent() {
    const { location } = useRouterState();

    return (
        <div
            className={classNames(
                'flex min-w-[600px] transform items-center justify-center overflow-hidden rounded-[12px] bg-primaryBottom transition-all',
                location.pathname === '/main' ? 'min-h-[563px]' : 'min-h-[620px]',
            )}
        >
            <LoadingIcon />
        </div>
    );
}

function createRedPacketRouter() {
    const memoryHistory = createMemoryHistory({
        initialEntries: ['/main'],
    });

    return createRouter({
        routeTree,
        history: memoryHistory,
        defaultPendingMinMs: 200,
        defaultPendingComponent: PendingComponent,
    });
}

export interface RedPacketModalOpenProps {}

export const RedPacketModal = forwardRef<SingletonModalRefCreator<RedPacketModalOpenProps | void>>(
    function RedPacketModal(_, ref) {
        const routerRef = useRef(createRedPacketRouter());
        const [open, dispatch] = useSingletonModal(ref, {
            onOpen: async (props) => {
                routerRef.current = createRedPacketRouter();
                routerRef.current.history.push('/main');
            },
        });

        const Router = <RouterProvider router={routerRef.current} />;

        return (
            <Modal open={open} onClose={() => dispatch?.close()}>
                <div>
                    <RedPacketProvider>{Router}</RedPacketProvider>
                </div>
            </Modal>
        );
    },
);
