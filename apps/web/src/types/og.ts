import type { LinkDigested as WorkerLinkDigested } from '@dimensiondev/workers-oembed';
import type { Hex } from 'viem';

export type { OpenGraph, OpenGraphImage } from '@dimensiondev/workers-oembed';

export interface LinkDigested extends WorkerLinkDigested {
    payload?: MirrorPayload | null;
}

export enum PayloadType {
    Mirror = 'Mirror',
}

export interface MirrorPayload {
    type: PayloadType.Mirror;
    address?: Hex;
    timestamp?: number;
    ens?: string;
    displayName?: string;
    body?: string;
    cover?: string;
}
