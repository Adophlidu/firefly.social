export * from './EVM.js';

export interface Response<T> {
    msg: string;
    code: number;
    data: T;
}

export interface PageableResponse<T> {
    data: {
        content: T[];
        next?: string;
        total?: number;
    };
}
