export enum FarcasterNetwork {
    NONE = 0,
    /** MAINNET - Public primary network */
    MAINNET = 1,
    /** TESTNET - Public test network */
    TESTNET = 2,
    /** DEVNET - Private test network */
    DEVNET = 3,
}

export enum CastType {
    CAST = 0,
    LONG_CAST = 1,
    TEN_K_CAST = 2,
}

export enum UserDataType {
    NONE = 0,
    /** PFP - Profile Picture for the user */
    PFP = 1,
    /** DISPLAY - Display Name for the user */
    DISPLAY = 2,
    /** BIO - Bio for the user */
    BIO = 3,
    /** URL - URL of the user */
    URL = 5,
    /** USERNAME - Preferred Name for the user */
    USERNAME = 6,
    /** LOCATION - Current location for the user */
    LOCATION = 7,
    /** TWITTER - Username of user on twitter */
    TWITTER = 8,
    /** GITHUB - Username of user on github */
    GITHUB = 9,
    /** BANNER - Banner image for the user */
    BANNER = 10,
    /** USER_DATA_PRIMARY_ADDRESS_ETHEREUM - Primary address for the user on Ethereum */
    USER_DATA_PRIMARY_ADDRESS_ETHEREUM = 11,
    /** USER_DATA_PRIMARY_ADDRESS_SOLANA - Primary address for the user on Solana */
    USER_DATA_PRIMARY_ADDRESS_SOLANA = 12,
}

export enum MessageType {
    NONE = 0,
    /** CAST_ADD - Add a new Cast */
    CAST_ADD = 1,
    /** CAST_REMOVE - Remove an existing Cast */
    CAST_REMOVE = 2,
    /** REACTION_ADD - Add a Reaction to a Cast */
    REACTION_ADD = 3,
    /** REACTION_REMOVE - Remove a Reaction from a Cast */
    REACTION_REMOVE = 4,
    /** LINK_ADD - Add a new Link */
    LINK_ADD = 5,
    /** LINK_REMOVE - Remove an existing Link */
    LINK_REMOVE = 6,
    /** VERIFICATION_ADD_ETH_ADDRESS - Add a Verification of an Ethereum Address */
    VERIFICATION_ADD_ETH_ADDRESS = 7,
    /** VERIFICATION_REMOVE - Remove a Verification */
    VERIFICATION_REMOVE = 8,
    /**
     * USER_DATA_ADD - Deprecated
     *  MESSAGE_TYPE_SIGNER_ADD = 9; // Add a new Ed25519 key pair that signs messages for a user
     *  MESSAGE_TYPE_SIGNER_REMOVE = 10; // Remove an Ed25519 key pair that signs messages for a user
     */
    USER_DATA_ADD = 11,
    /** USERNAME_PROOF - Add or replace a username proof */
    USERNAME_PROOF = 12,
    /** FRAME_ACTION - A Farcaster Frame action */
    FRAME_ACTION = 13,
    /** LINK_COMPACT_STATE - Link Compaction State Message */
    LINK_COMPACT_STATE = 14,
}

export enum ReactionType {
    NONE = 0,
    /** LIKE - Like the target cast */
    LIKE = 1,
    /** RECAST - Share target cast to the user's audience */
    RECAST = 2,
}
