import { Lock } from "./lock";
import { Address } from "./types";

/**
 * Represents a smart contract managing locks and access control
 * This is a singleton pattern to simulate blockchain smart contract behavior
 */
export class SmartContract {
  private static instance: SmartContract;

  // Mapping from lockId to Lock object
  private locks: Map<number, Lock>;

  // Counter for generating unique lock IDs
  private lockCounter: number;

  private constructor() {
    this.locks = new Map();
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
   * Returns the generated lockId, the actual Lock object is managed by DeviceOwner
   */
  registerLock(pubK: string, owner: Address): number {
    const lockId = this.lockCounter++;

    const lock = new Lock(lockId, owner, pubK);

    this.locks.set(lockId, lock);

    console.log(`Smart Contract: Registered lock ${lockId} for owner ${owner}`);
    return lockId;
  }

  /**
   * Revokes a lock by its ID
   * Only the owner of the lock can revoke it
   */
  revokeLock(lockId: number, owner: Address): void {
    const lock = this.locks.get(lockId);

    if (!lock) {
      throw new Error(`Lock with ID ${lockId} not found in smart contract`);
    }

    if (!lock.isOwnedBy(owner)) {
      throw new Error(`Address ${owner} is not the owner of lock ${lockId}`);
    }

    lock.deactivate();
    console.log(`Smart Contract: Revoked lock ${lockId}`);
  }

  /**
   * Gets a lock by its ID
   */
  getLockById(lockId: number): Lock | undefined {
    return this.locks.get(lockId);
  }

  /**
   * Checks if an address owns a specific lock
   */
  isOwner(owner: Address, lockId: number): boolean {
    const lock = this.locks.get(lockId);
    return lock ? lock.isOwnedBy(owner) : false;
  }

  /**
   * Transfers ownership of a lock to a new owner
   */
  transferOwnership(
    lockId: number,
    currentOwner: Address,
    newOwner: Address
  ): void {
    const lock = this.locks.get(lockId);

    if (!lock) {
      throw new Error(`Lock with ID ${lockId} not found`);
    }

    if (!lock.isOwnedBy(currentOwner)) {
      throw new Error(
        `Address ${currentOwner} is not the owner of lock ${lockId}`
      );
    }
    lock.owner = newOwner;

    console.log(
      `Smart Contract: Transferred ownership of lock ${lockId} from ${currentOwner} to ${newOwner}`
    );
  }

  activateLock(lockId: number, owner: Address): void {
    const lock = this.locks.get(lockId);
    if (!lock) {
      throw new Error(`Lock with ID ${lockId} not found`);
    }
    if (!lock.isOwnedBy(owner)) {
      throw new Error(`Address ${owner} is not the owner of lock ${lockId}`);
    }
    lock.activate();
    console.log(`Smart Contract: Activated lock ${lockId}`);
  }

  /**
   * Gets the total number of locks in the system
   */
  getTotalLocks(): number {
    return this.locks.size;
  }

  /**
   * Checks if a lock is active (not revoked)
   */
  isLockActive(lockId: number): boolean {
    const lock = this.locks.get(lockId);
    return lock ? lock.isActive : false;
  }

  /**
   * Fetches the public key for a lock
   * Returns null if the lock doesn't exist or is inactive
   */
  fetchPublicKey(lockId: number): string | null {
    const lock = this.locks.get(lockId);

    if (!lock) {
      console.log(`Smart Contract: Lock with ID ${lockId} not found`);
      return null;
    }

    if (!lock.isActive) {
      console.log(`Smart Contract: Lock with ID ${lockId} is inactive/revoked`);
      return null;
    }

    return lock.publicKey;
  }
}
