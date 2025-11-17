import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import { Source } from '@/constants/enum.js';
import { ETH_ZERO_ADDRESS } from '@/helpers/isZeroAddress.js';
import { dividedBy } from '@/helpers/number.js';
import { createSelectors } from '@/helpers/createSelector.js';
import type { FireflyIdentity, FireflyTipsProfile, Profile } from '@/providers/types/Firefly.js';
import type { Post } from '@/providers/types/SocialMedia.js';
import type { Token } from '@/providers/types/Transfer.js';
import { useDebounceValue } from 'usehooks-ts';

interface TipsBaseState {
    open: boolean;
    recipientList: FireflyTipsProfile[];
    recipient: FireflyTipsProfile | null;
    amount: string;
    latestCustomAmount: string;
    token: Token | null;
    handle: string | null;
    hash: string | null;
    pureWallet: boolean;
    socialProfiles: Profile[];
    isSending: boolean;
    hasError: boolean;
    error: Error | null;
    identity: FireflyIdentity;
    post: Post | null;
    selectedUsdtValue?: number;
}

interface TipsState extends TipsBaseState {
    // actions
    update: (state: Partial<TipsBaseState>) => void;
    reset: () => void;
}

function createInitialState(): TipsBaseState {
    return {
        open: false,
        recipient: null,
        amount: '',
        latestCustomAmount: '',
        token: null,
        recipientList: [],
        handle: null,
        hash: null,
        pureWallet: false,
        socialProfiles: [],
        isSending: false,
        error: null,
        hasError: false,
        identity: {
            id: ETH_ZERO_ADDRESS,
            source: Source.Wallet,
        },
        post: null,
        selectedUsdtValue: 5,
    };
}

const useTipsStoreBase = create<TipsState, [['zustand/immer', unknown]]>(
    immer((set, get) => ({
        ...createInitialState(),

        update: (nextState) =>
            set((state) => {
                Object.assign(state, nextState);
            }),

        reset: () =>
            set((state) => {
                Object.assign(state, createInitialState());
            }),
    })),
);

const useTipsStoreWithSelectors = createSelectors(useTipsStoreBase);

// Wrapper hook that adds computed values
export function useTipsStore() {
    const state = useTipsStoreWithSelectors();

    const [tokenAmount] = useDebounceValue(() => {
        if (!state.token || state.amount) return state.amount;
        if (!state.token.price || !state.selectedUsdtValue) return state.amount;

        return dividedBy(state.selectedUsdtValue, state.token.price).toString();
    }, 400);

    return {
        ...state,
        tokenAmount,
        showLoadingView: state.isSending && !state.hasError && !!state.hash,
        showFailedView: !state.isSending && state.hasError,
    };
}
