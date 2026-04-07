import { createContext, useContext } from 'react';

import { type RecipientItemProps } from '@/components/SendTransactionModal/RecipientItem.js';
import { type Token } from '@/providers/types/Transfer.js';

export enum RoutePath {
    Form = '/send/form',
    SelectToken = '/send/tokens',
    SearchRecipients = '/send/recipients',
    ChooseRecipient = '/send/recipient/choose',
    Failed = '/send/failed',
    Success = '/send/success',
}

export interface FormValues {
    to: string;
    amount: string;
    token: Token;
    recipient?: RecipientItemProps;
}

interface SendTokenContextValue {
    token: Token | null;
    setToken: (token: Token | null) => void;
}

export const SendTokenContext = createContext<SendTokenContextValue>({
    token: null,
    setToken: () => {},
});

export function useSendToken() {
    return useContext(SendTokenContext);
}
