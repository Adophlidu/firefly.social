export enum ChainId {
    Mainnet = 101,
    Testnet = 102,
    Devnet = 103,
    // For any chains not supported yet.
    Invalid = 0,
}

export enum SchemaType {
    Native = 1,
    Fungible = 2,
    NonFungible = 3,
}

export enum NetworkType {
    Solana = 'Solana',
}

export enum ProviderType {
    None = 'None',
}

export interface Web3Definition {
    ChainId: ChainId;
    SchemaType: SchemaType;
    NetworkType: NetworkType;
}
