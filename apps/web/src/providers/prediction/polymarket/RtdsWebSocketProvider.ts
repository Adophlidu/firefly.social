import { parseJson } from '@dimensiondev/utils';

import { logger } from '@/libs/Logger.js';
import { POLYMARKET_RTDS_WS_URL } from '@/providers/prediction/polymarket/constants.js';

const MAX_RETRY_ATTEMPTS = 5;
const PING_INTERVAL_MS = 5000;

interface RtdsPricePoint {
    timestamp: number;
    value: number;
}

interface RtdsPricePayload {
    symbol: string;
    timestamp: string;
    value: string;
    data?: RtdsPricePoint[];
}

export interface RtdsPriceMessage {
    topic: string;
    type: string;
    timestamp: string;
    payload: RtdsPricePayload;
}

export class RtdsWebSocketProvider {
    private ws: WebSocket | null = null;
    private reconnectAttempts = 0;
    private reconnectDelay = 3000;
    private isConnected = false;
    private pingInterval: number | null = null;
    private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    private symbol = '';
    private callback: ((price: number, timestamp: number) => void) | null = null;
    private historyCallback: ((points: Array<{ price: number; timestamp: number }>) => void) | null = null;

    private connect() {
        try {
            this.ws = new WebSocket(POLYMARKET_RTDS_WS_URL);
            this.setupEventHandlers();
        } catch (error) {
            logger.error('RtdsWebSocketProvider: Failed to create WebSocket:', error);
            this.handleReconnect();
        }
    }

    private handleReconnect() {
        if (this.reconnectAttempts >= MAX_RETRY_ATTEMPTS) {
            logger.error('RtdsWebSocketProvider: Max reconnect attempts reached.');
            return;
        }

        this.reconnectAttempts += 1;
        const delay = this.reconnectDelay * this.reconnectAttempts;

        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            if (!this.isConnected) {
                this.connect();
            }
        }, delay);
    }

    private setupEventHandlers() {
        if (!this.ws) return;

        this.ws.onopen = this.handleOpen.bind(this);
        this.ws.onmessage = this.handleMessage.bind(this);
        this.ws.onerror = this.handleError.bind(this);
        this.ws.onclose = this.handleClose.bind(this);
    }

    private handleOpen() {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.sendSubscription();
        this.startPing();
    }

    private handleMessage(event: MessageEvent) {
        try {
            const raw = event.data as string;
            if (raw === 'PONG' || raw === 'pong') return;

            const msg = parseJson<RtdsPriceMessage>(raw);
            if (!msg?.payload) return;

            if (msg.type === 'subscribe' && Array.isArray(msg.payload.data)) {
                const points = msg.payload.data
                    .filter((p) => p.value > 0)
                    .map((p) => ({ price: p.value, timestamp: p.timestamp }));
                if (points.length > 0) {
                    this.historyCallback?.(points);
                    const last = points[points.length - 1];
                    this.callback?.(last.price, last.timestamp);
                }
                return;
            }

            if (msg.payload.value === null) return;
            const price = parseFloat(msg.payload.value);
            const rawTs = Number(msg.payload.timestamp);
            const ts = rawTs > 0 ? (rawTs < 1e12 ? rawTs * 1000 : rawTs) : Date.now();
            if (!Number.isNaN(price) && price > 0) {
                this.callback?.(price, ts);
            }
        } catch (error) {
            logger.error('RtdsWebSocketProvider: Error handling message:', error);
        }
    }

    private handleError(event: Event) {
        logger.error('RtdsWebSocketProvider: WebSocket error:', event);
        this.handleReconnect();
    }

    private handleClose(event: CloseEvent) {
        this.isConnected = false;
        this.cleanupPing();

        if (!event.wasClean && event.code !== 1000) {
            this.handleReconnect();
        }
    }

    private sendSubscription() {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.symbol) return;

        this.ws.send(
            JSON.stringify({
                action: 'subscribe',
                subscriptions: [
                    {
                        topic: 'crypto_prices_chainlink',
                        type: '*',
                        filters: JSON.stringify({ symbol: this.symbol }),
                    },
                ],
            }),
        );
    }

    private startPing() {
        this.cleanupPing();
        this.pingInterval = window.setInterval(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send('PING');
            }
        }, PING_INTERVAL_MS);
    }

    private cleanupPing() {
        if (this.pingInterval !== null) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
    }

    public subscribe(
        symbol: string,
        callback: (price: number, timestamp: number) => void,
        historyCallback?: (points: Array<{ price: number; timestamp: number }>) => void,
    ) {
        this.symbol = symbol;
        this.callback = callback;
        this.historyCallback = historyCallback ?? null;

        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.sendSubscription();
            return;
        }

        this.connect();
    }

    public close() {
        this.cleanupPing();

        if (this.reconnectTimer !== null) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }

        if (this.ws) {
            this.ws.onopen = null;
            this.ws.onmessage = null;
            this.ws.onerror = null;
            this.ws.onclose = null;

            if (this.ws.readyState === WebSocket.OPEN) {
                this.ws.close(1000, 'Normal closure');
            }

            this.ws = null;
        }

        this.symbol = '';
        this.callback = null;
        this.historyCallback = null;
        this.isConnected = false;
    }
}
