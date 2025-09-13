import { Address, KeyPair } from "./types";

/**
 * Represents a smart lock in the access control system
 */
export class Lock {
  public lockId: number;
  public owner: Address;
  public publicKey: string;
  public isActive: boolean;
  public createdAt: number; // uint256 timestamp

  constructor(
    lockId: number,
    owner: Address,
    publicKey: string,
    isActive: boolean = true
  ) {
    this.lockId = lockId;
    this.owner = owner;
    this.publicKey = publicKey;
    this.isActive = isActive;
    this.createdAt = Date.now();
  }

  /**
   * Gets the public key for verification
   */
  getPublicKey(): string {
    return this.publicKey;
  }

  /**
   * Checks if the lock is owned by the given address
   */
  isOwnedBy(address: Address): boolean {
    return this.owner === address;
  }

  /**
   * Checks if the lock has been revoked (not active)
   */
  isRevoked(address: Address): boolean {
    // In a real implementation, this would check against a revocation list
    // For now, we'll just check if the lock is inactive
    return !this.isActive;
  }

  /**
   * Deactivates the lock
   */
  deactivate(): void {
    this.isActive = false;
  }

  /**
   * Activates the lock
   */
  activate(): void {
    this.isActive = true;
  }

  /**
   * Returns a string representation of the lock
   */
  toString(): string {
    return `Lock(${this.lockId}, owner: ${this.owner}, active: ${this.isActive})`;
  }
}

export class MyLock extends Lock {
  public privateKey: string;
  public nickname?: string;

  constructor(
    lockId: number,
    owner: Address,
    keyPair: KeyPair,
    nickname?: string,
    isActive: boolean = true
  ) {
    super(lockId, owner, keyPair.publicKey, isActive);
    this.privateKey = keyPair.privateKey;
    this.nickname = nickname;
  }
}
