import {
    type ExchangeClient,
    HttpTransport,
    InfoClient,
    SubscriptionClient,
    WebSocketTransport,
} from '@nktkas/hyperliquid';
import { createContext, type ReactNode, useMemo } from 'react';

interface Props {
    children: ReactNode;
}

export interface HyperliquidContextType {
    infoClient: InfoClient;
    subscriptionClient: SubscriptionClient;
    exchangeClient: ExchangeClient | null;
}

export const HyperliquidContext = createContext<HyperliquidContextType | null>(null);

const httpTransport = new HttpTransport();
const wsTransport = new WebSocketTransport();

export function HyperliquidProvider({ children }: Props) {
    const contextValue = useMemo(
        () => ({
            infoClient: new InfoClient({ transport: httpTransport }),
            subscriptionClient: new SubscriptionClient({ transport: wsTransport }),
            exchangeClient: null, // Placeholder until wallet integration is added
        }),
        [],
    );

    return <HyperliquidContext.Provider value={contextValue}>{children}</HyperliquidContext.Provider>;
}
