/**
 * Represents a verifiable credential containing user metadata
 */
export interface VerifiableCredential {
  userMetaDataHash: string; // hash
  lockId: number;
  lockNickname: string;
  signature: string;
}

/**
 * Represents a cryptographic key pair
 */
export interface KeyPair {
  publicKey: string;
  privateKey: string;
}

/**
 * Represents an address (could be wallet address, device address, etc.)
 */
export type Address = string;

/**
 * Represents a hash value
 */
export type Hash = string;
