import { AsyncStatus, type ProfileSource, Source } from '@dimensiondev/enums';
import type { StateSnapshot } from 'react-virtuoso';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { createSelectors } from '@/helpers/createSelector.js';
import { getCurrentSourceFromUrl } from '@/helpers/getCurrentSourceFromUrl.js';

type WalletEventCallback = (data?: unknown) => void;

// Subscriptions stored outside of persisted state
const walletEventSubscriptions = new Map<string, Set<WalletEventCallback>>();

interface GlobalState {
    routeChanged: boolean;

    asyncStatus: Record<ProfileSource, AsyncStatus>;
    setAsyncStatus: (source: ProfileSource, status: AsyncStatus) => void;

    scrollIndex: Record<string, number>;
    setScrollIndex: (key: string, value: number) => void;

    virtuosoState: Record<'temporary' | 'cached', Record<string, StateSnapshot | undefined>>;
    setVirtuosoState: (key: 'temporary' | 'cached', listKey: string, snapshot: StateSnapshot) => void;

    currentSource: Source;
    updateCurrentSource: (source: Source) => void;

    collapsedConnectWallet: boolean;
    updateCollapsedConnectWallet: (collapsed: boolean) => void;

    fireflyWalletIsOpen: boolean;
    updateFireflyWalletIsOpen: (isOpen: boolean) => void;

    publishWalletEvent: (type: string, data?: unknown) => void;
    subscribeToWalletEvents: (eventType: string, callback: WalletEventCallback) => () => void;

    web3StateAsyncStatus: AsyncStatus;
    setWeb3StateAsyncStatus: (status: AsyncStatus) => void;

    isSyncingMetrics: boolean;
    setIsSyncingMetrics: (status: boolean) => void;

    routePositionRecords: Record<string, number>;
    setRoutePositionRecords: (pathname: string, position: number) => void;
}

const useGlobalStateBase = create<GlobalState, [['zustand/persist', unknown], ['zustand/immer', never]]>(
    persist(
        immer((set) => ({
            routeChanged: false,

            asyncStatus: {
                [Source.Farcaster]: AsyncStatus.Idle,
                [Source.Lens]: AsyncStatus.Idle,
                [Source.Twitter]: AsyncStatus.Idle,
                [Source.Bsky]: AsyncStatus.Idle,
                [Source.Email]: AsyncStatus.Idle,
                [Source.Telegram]: AsyncStatus.Idle,
                [Source.Apple]: AsyncStatus.Idle,
                [Source.Google]: AsyncStatus.Idle,
                [Source.Firefly]: AsyncStatus.Idle,
            },
            setAsyncStatus: (source: ProfileSource, status: AsyncStatus) =>
                set((state) => {
                    state.asyncStatus[source] = status;
                }),

            currentSource: getCurrentSourceFromUrl(),
            updateCurrentSource: (source: Source) =>
                set((state) => {
                    state.currentSource = source;
                }),

            scrollIndex: {},
            setScrollIndex: (key: string, value) => {
                set((state) => {
                    state.scrollIndex[key] = value;
                    const temporarySnapshot = state.virtuosoState.temporary[key];
                    if (temporarySnapshot) {
                        state.virtuosoState.cached[key] = temporarySnapshot;
                        state.virtuosoState.temporary[key] = undefined;
                    }
                });
            },

            virtuosoState: {
                temporary: {},
                cached: {},
            },
            setVirtuosoState: (key, listKey, snapshot) => {
                set((state) => {
                    state.virtuosoState[key][listKey] = snapshot;
                });
            },

            collapsedConnectWallet: false,
            updateCollapsedConnectWallet(collapsed) {
                set((state) => {
                    state.collapsedConnectWallet = collapsed;
                });
            },

            fireflyWalletIsOpen: false,
            updateFireflyWalletIsOpen(isOpen) {
                set((state) => {
                    state.fireflyWalletIsOpen = isOpen;
                });
            },

            publishWalletEvent: (type, data) => {
                const callbacks = walletEventSubscriptions.get(type);
                callbacks?.forEach((cb) => cb(data));
            },
            subscribeToWalletEvents: (eventType, callback) => {
                if (!walletEventSubscriptions.has(eventType)) {
                    walletEventSubscriptions.set(eventType, new Set());
                }
                walletEventSubscriptions.get(eventType)!.add(callback);
                return () => {
                    const callbacks = walletEventSubscriptions.get(eventType);
                    callbacks?.delete(callback);
                    if (callbacks?.size === 0) walletEventSubscriptions.delete(eventType);
                };
            },

            web3StateAsyncStatus: AsyncStatus.Pending,
            setWeb3StateAsyncStatus(status) {
                set((state) => {
                    state.web3StateAsyncStatus = status;
                });
            },

            isSyncingMetrics: false,
            setIsSyncingMetrics(status) {
                set((state) => {
                    state.isSyncingMetrics = status;
                });
            },

            routePositionRecords: {},
            setRoutePositionRecords(pathname, position) {
                set((state) => {
                    state.routePositionRecords[pathname] = position;
                });
            },
        })),
        {
            name: 'global-state',
            storage: createJSONStorage(() => sessionStorage),
            partialize: (state) => ({
                routeChanged: state.routeChanged,
            }),
        },
    ),
);

export const useGlobalState = createSelectors(useGlobalStateBase);
