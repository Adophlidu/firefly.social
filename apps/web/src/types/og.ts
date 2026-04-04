import { type Hex } from 'viem';

interface OpenGraphImage {
    url: string;
    width: number;
    height: number;
}

export interface LinkDigested {
    og: OpenGraph;
    payload?: MirrorPayload | null;
}

export interface OpenGraph {
    type: 'website';
    url: string;
    favicon: string;
    title: string | null;
    description: string | null;
    site: string | null;
    image: OpenGraphImage | null;
    isLarge: boolean;
    html: string | null;
    locale: string | null;
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
