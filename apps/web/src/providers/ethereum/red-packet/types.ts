import type { NetworkType, SocialSource } from '@dimensiondev/enums';

import type { RedPacketJSONPayload } from '@/providers/types/FireflyRedPacket.js';
import type { FungibleToken } from '@/web3-shared/base/specs.js';
import type { EthereumSchemaType } from '@/web3-shared/evm/types.js';

export interface CreateRedPacketContext {
    networkType: NetworkType;
    creator: string;
    chainId: number;
    version: number;
    publicKey: string;
    shares: number;
    duration: number;
    isRandom: boolean;
    total: string;
    name: string;
    message: string;
    token?: FungibleToken<number, EthereumSchemaType.Native | EthereumSchemaType.ERC20>;
}

export interface ClaimRedPacketContext {
    contextChainId: number;
    account: string;
    source: SocialSource;
    payload: RedPacketJSONPayload;
}

export interface CreateRedPacketParams {
    publicKey: string;
    shares: number;
    isRandom: boolean;
    duration: number;
    seed: string;
    message: string;
    name: string;
    tokenType: number;
    tokenAddress: string;
    total: string;
    token?: FungibleToken<number, EthereumSchemaType.Native | EthereumSchemaType.ERC20>;
}
