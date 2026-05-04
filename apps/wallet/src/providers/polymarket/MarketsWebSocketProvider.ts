import { parseJson } from '@dimensiondev/utils';

import { logger } from '@/lib/Logger.js';

const POLYMARKET_WS_URL = 'wss://ws-subscriptions-clob.polymarket.com';
const MARKET_CHANNEL = 'market';
const MAX_RETRY_ATTEMPTS = 5;

export interface MarketPriceChangeData {
    asset_id: string;
    best_ask: string;
    best_bid: string;
    hash: string;
    price: string;
    side: 'BUY' | 'SELL';
    size: string;
}

interface MarketPriceChangeMessage {
    event_type: 'price_change' | '';
    market: string;
    timestamp: string;
    price_changes: MarketPriceChangeData[];
}
type MarketOrderBookChangeMessage = Array<{
    event_type: 'book';
    market: string;
    asks: Array<{ price: string; size: string }>;
    bids: Array<{ price: string; size: string }>;
    hash: string;
    last_trade_price: string;
    timestamp: string;
}>;

export type MarketMessage = MarketPriceChangeMessage | MarketOrderBookChangeMessage;

export class MarketsWebSocketProvider {
    private ws: WebSocket | null = null;
    private reconnectAttempts = 0;
    private reconnectDelay = 3000;
    private isConnected = false;
    private pingInterval: number | null = null;
    private assetsIds: string[] = [];
    private onEventCallbacks: Array<(message?: MarketMessage) => void> = [];

    private connect() {
        const fullUrl = `${POLYMARKET_WS_URL}/ws/${MARKET_CHANNEL}`;

        try {
            this.ws = new WebSocket(fullUrl);
            this.setupEventHandlers();
        } catch (error) {
            logger.error('Failed to create WebSocket:', error);
            this.handleReconnect();
        }
    }

    private handleReconnect() {
        if (this.reconnectAttempts >= MAX_RETRY_ATTEMPTS) {
            logger.error('Max reconnect attempts reached. Giving up.');
            return;
        }

        this.reconnectAttempts += 1;
        const delay = this.reconnectDelay * this.reconnectAttempts;

        setTimeout(() => {
            if (!this.isConnected) {
                logger.info(`Attempting to reconnect... (Attempt ${this.reconnectAttempts})`);
                this.connect();
            }
        }, delay);
    }

    private setupEventHandlers() {
        if (!this.ws) return;

        this.ws.onmessage = this.handleMessage.bind(this);
        this.ws.onerror = this.handleError.bind(this);
        this.ws.onclose = this.handleClose.bind(this);
        this.ws.onopen = this.handleOpen.bind(this);
    }

    private handleMessage(event: MessageEvent) {
        try {
            const message = event.data;
            if (message === 'PONG' || message === 'ping') return;

            const parsedMessage = parseJson<MarketMessage>(message);
            this.onEventCallbacks.forEach((callback) => callback(parsedMessage));
        } catch (error) {
            logger.error('Error handling message:', error);
        }
    }

    private handleError(event: Event) {
        logger.error('WebSocket error:', event);
        this.handleReconnect();
    }

    private handleClose(event: CloseEvent) {
        logger.info('WebSocket closed:', {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean,
        });

        this.isConnected = false;
        this.cleanupPingInterval();

        if (!event.wasClean && event.code !== 1000) {
            this.handleReconnect();
        }
    }

    private handleOpen(event: Event) {
        logger.info('WebSocket connection opened');
        this.isConnected = true;
        this.reconnectAttempts = 0;

        this.sendInitialSubscription();
        this.startPing();
    }

    private cleanupPingInterval(): void {
        if (this.pingInterval !== null) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
    }

    private sendInitialSubscription() {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            logger.warn('WebSocket is not open, cannot send initial subscription');
            return;
        }
        if (!this.assetsIds.length) {
            logger.warn('No asset IDs to subscribe to');
            return;
        }

        this.ws.send(
            JSON.stringify({
                type: 'markets',
                assets_ids: this.assetsIds,
            }),
        );
    }

    private startPing(): void {
        this.cleanupPingInterval();

        this.pingInterval = window.setInterval(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send('PING');
            }
        }, 10000);
    }

    public close(): void {
        logger.info('Closing WebSocket connection');

        this.cleanupPingInterval();

        if (this.ws) {
            this.ws.onmessage = null;
            this.ws.onerror = null;
            this.ws.onclose = null;
            this.ws.onopen = null;

            if (this.ws.readyState === WebSocket.OPEN) {
                this.ws.close(1000, 'Normal closure');
            }

            this.ws = null;
        }

        this.assetsIds = [];
        this.onEventCallbacks = [];
        this.isConnected = false;
    }

    public subscribeToMarket(assetsIds: string[], callback: (message?: MarketMessage) => void) {
        const newIds = assetsIds.filter((id) => !this.assetsIds.includes(id));
        if (newIds.length) this.assetsIds = [...this.assetsIds, ...newIds];
        this.onEventCallbacks.push(callback);

        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.sendInitialSubscription();
            return;
        }

        this.connect();
    }
}
