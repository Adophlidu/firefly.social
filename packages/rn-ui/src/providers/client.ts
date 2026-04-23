import { HttpTransport, InfoClient } from '@nktkas/hyperliquid';

export const httpTransport = new HttpTransport();

export const infoClient = new InfoClient({ transport: httpTransport });
