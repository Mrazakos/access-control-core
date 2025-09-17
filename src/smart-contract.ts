import { Address } from "./types";

/**
 * Represents a smart contract managing locks and access control
 * This is a singleton pattern to simulate blockchain smart contract behavior
 */
export class SmartContract {
  private static instance: SmartContract;

  // Mapping from lockId to public key
  private lockPublicKeys: Map<number, string>;

  // Mapping from lockId to owner address
  private lockOwners: Map<number, Address>;

  // Mapping from lockId to Revoked signature (if revoked)
  private revoked: Map<number, Set<string>>;

  // Counter for generating unique lock IDs
  private lockCounter: number;

  private constructor() {
    this.lockPublicKeys = new Map();
    this.lockOwners = new Map();
    this.revoked = new Map();
    this.lockCounter = 1;
  }

  /**
   * Gets the singleton instance of the smart contract
   */
  public static getInstance(): SmartContract {
    if (!SmartContract.instance) {
      SmartContract.instance = new SmartContract();
    }
    return SmartContract.instance;
  }

  /**
   * Registers a new lock in the smart contract
   * Returns the generated lockId
   */
  registerLock(pubK: string, owner: Address): number {
    const lockId = this.lockCounter++;

    this.lockPublicKeys.set(lockId, pubK);
    this.lockOwners.set(lockId, owner);

    console.log(`Smart Contract: Registered lock ${lockId} for owner ${owner}`);
    return lockId;
  }

  /**
   * Revokes a lock by its ID
   * Only the owner of the lock can revoke it
   */
  revokeSignature(lockId: number, signature: string, owner: Address): void {
    if (!this.lockOwners.has(lockId)) {
      throw new Error(`Lock with ID ${lockId} not found in smart contract`);
    }

    if (this.lockOwners.get(lockId) !== owner) {
      throw new Error(`Address ${owner} is not the owner of lock ${lockId}`);
    }

    // Get existing set or create new one if it doesn't exist
    if (!this.revoked.has(lockId)) {
      this.revoked.set(lockId, new Set());
    }

    this.revoked.get(lockId)!.add(signature);
    console.log(
      `Smart Contract: Revoked lock ${lockId} with signature ${signature}`
    );
  }

  fetchRevokedSignatures(lockId: number): Set<string> | undefined {
    return this.revoked.get(lockId);
  }

  /**
   * Checks if an address owns a specific lock
   */
  isOwner(owner: Address, lockId: number): boolean {
    return this.lockOwners.get(lockId) === owner;
  }

  /**
   * Gets the owner of a specific lock
   */
  getOwner(lockId: number): Address | undefined {
    return this.lockOwners.get(lockId);
  }

  /**
   * Transfers ownership of a lock to a new owner
   */
  transferOwnership(
    lockId: number,
    currentOwner: Address,
    newOwner: Address
  ): void {
    if (!this.lockOwners.has(lockId)) {
      throw new Error(`Lock with ID ${lockId} not found`);
    }

    if (this.lockOwners.get(lockId) !== currentOwner) {
      throw new Error(
        `Address ${currentOwner} is not the owner of lock ${lockId}`
      );
    }

    this.lockOwners.set(lockId, newOwner);

    console.log(
      `Smart Contract: Transferred ownership of lock ${lockId} from ${currentOwner} to ${newOwner}`
    );
  }

  /**
   * Gets the total number of locks in the system
   */
  getTotalLocks(): number {
    return this.lockOwners.size;
  }

  /**
   * Fetches the public key for a lock
   * Returns null if the lock doesn't exist or is inactive
   */
  fetchPublicKey(lockId: number): string | null {
    if (!this.lockPublicKeys.has(lockId)) {
      console.log(`Smart Contract: Lock with ID ${lockId} not found`);
      return null;
    }

    return this.lockPublicKeys.get(lockId) || null;
  }
}
