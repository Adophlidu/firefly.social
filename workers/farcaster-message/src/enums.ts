export enum HashScheme {
    NONE = 0,
    /** BLAKE3 - Default scheme for hashing MessageData */
    BLAKE3 = 1,
}

export enum SignatureScheme {
    NONE = 0,
    /** ED25519 - Ed25519 signature (default) */
    ED25519 = 1,
    /** EIP712 - ECDSA signature using EIP-712 scheme */
    EIP712 = 2,
}
