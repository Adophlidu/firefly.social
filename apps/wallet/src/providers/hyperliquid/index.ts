import { HttpTransport, InfoClient, SubscriptionClient, WebSocketTransport } from '@nktkas/hyperliquid';

const httpTransport = new HttpTransport();
const wsTransport = new WebSocketTransport();

export const infoClient = new InfoClient({ transport: httpTransport });
export const subscriptionClient = new SubscriptionClient({ transport: wsTransport });
