import type { ClaimStrategy } from '@/providers/types/FireflyRedPacket.js';

export enum UsageType {
    Cover = 'cover',
    Payload = 'payload',
}

export interface RedPacketPayload {
    publicKey?: string;
    payloadImage: string;
    claimRequirements: ClaimStrategy[];
    metadata: RedPacketMetadata;
}

export interface RedPacketMetadata {
    contract_address: string;
    contract_version: number;
    creation_time: number;
    duration: number;
    is_random: boolean;
    network: string;
    password: string;
    rpid: string;
    sender: { address: string; name: string; message: string };
    shares: number;
    token: { decimals: number; symbol: string; address: string; chainId: number };
    total: string;
}

export interface RedPacketCreationSuccessEventArgs {
    creation_time: string;
    creator: string;
    id: string;
    token_address: string;
    total: bigint;
    name: string;
    message: string;
    duration: number;
    ifrandom: boolean;
}
