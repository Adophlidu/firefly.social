export enum IframeBridgeMethod {
    COMPOSE = 'compose',
    LOGIN = 'login',
    ENQUEUE_MESSAGE = 'enqueueMessage',
}

export interface IframeBridgeMessage {
    type: 'iframe-bridge-request' | 'iframe-bridge-response';
    method: IframeBridgeMethod;
    id: string;
    params?: unknown;
    payload?: {
        result?: unknown;
        error?: string;
    };
}

export interface IframeBridgeRequestArguments {
    [IframeBridgeMethod.COMPOSE]: {
        text: string;
        activity: string;
    };
    [IframeBridgeMethod.ENQUEUE_MESSAGE]: {
        type: 'success' | 'error' | 'info' | 'warning';
        message: string;
        duration?: number;
    };
    [IframeBridgeMethod.LOGIN]: {
        source?: string;
    };
}

export interface IframeBridgeResponseResult {
    [IframeBridgeMethod.COMPOSE]: void;
    [IframeBridgeMethod.ENQUEUE_MESSAGE]: void;
    [IframeBridgeMethod.LOGIN]: void;
}
