import { useState } from 'react';
import { createContainer } from 'unstated-next';
import { useDebounceValue } from 'usehooks-ts';

import { type NetworkType, Source } from '@/constants/enum.js';
import { ETH_ZERO_ADDRESS } from '@/helpers/isZeroAddress.js';
import { dividedBy } from '@/helpers/number.js';
import type { FireflyIdentity, FireflyProfile, Profile } from '@/providers/types/Firefly.js';
import type { Post } from '@/providers/types/SocialMedia.js';
import type { Token } from '@/providers/types/Transfer.js';

export type TipsProfile = FireflyProfile & { address: string; networkType: NetworkType; avatar?: string; ens?: string };

interface TipsContext {
    recipientList: TipsProfile[];
    recipient: TipsProfile | null;
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

const DEFAULT_SELECTED_USDT_VALUE = 5;

function createEmptyContext(): TipsContext {
    return {
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
        selectedUsdtValue: DEFAULT_SELECTED_USDT_VALUE,
    };
}

function useTipsContext(initialState?: TipsContext) {
    const [value, setValue] = useState<TipsContext>(initialState ?? createEmptyContext());

    const [tokenAmount] = useDebounceValue(() => {
        if (!value.token || value.amount) return value.amount;
        if (!value.token.price || !value.selectedUsdtValue) return value.amount;

        return dividedBy(value.selectedUsdtValue, value.token.price).toString();
    }, 400);

    return {
        ...value,
        tokenAmount,
        showLoadingView: value.isSending && !value.hasError && !!value.hash,
        showFailedView: !value.isSending && value.hasError,
        update: setValue,
        reset: () => setValue(createEmptyContext()),
    };
}

export const TipsContext = createContainer(useTipsContext);
