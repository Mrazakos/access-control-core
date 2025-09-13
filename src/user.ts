import { VerifiableCredential } from "./types";
import { Lock } from "./lock";
import { CryptoUtils } from "./crypto-utils";

/**
 * Represents a user in the access control system
 */
export class User {
  public vcs: VerifiableCredential[];

  constructor() {
    this.vcs = [];
  }

  /**
   * Stores a verifiable credential for the user
   * Ensures only one VC per lock - replaces existing VC if one exists for the same lockId
   */
  storeVc(vc: VerifiableCredential): void {
    const existingVcIndex = this.vcs.findIndex(
      (existingVc) => existingVc.lockId === vc.lockId
    );

    if (existingVcIndex !== -1) {
      console.log(`Replacing existing VC for lock ${vc.lockId}`);
      this.vcs[existingVcIndex] = vc;
    } else {
      this.vcs.push(vc);
      console.log(`Stored new VC for lock ${vc.lockId}`);
    }
  }

  removeVc(index: number): void {
    this.vcs.splice(index, 1);
  }

  /**
   * Removes the VC for a specific lock
   */
  removeVcForLock(lockId: number): boolean {
    const index = this.vcs.findIndex((vc) => vc.lockId === lockId);
    if (index !== -1) {
      this.vcs.splice(index, 1);
      console.log(`Removed VC for lock ${lockId}`);
      return true;
    }
    return false;
  }

  /**
   * Unlocks a specific lock by ID
   */
  unlock(lockId: number): boolean {
    const relevantVc = this.getCredentialForLock(lockId);

    if (!relevantVc) {
      console.log(`No verifiable credential found for lock ${lockId}`);
      return false;
    }

    console.log(`Successfully found VC for lock ${lockId}`);
    return true;
  }

  /**
   * Gets the verifiable credential for a specific lock
   * Returns the single VC for the lock, or undefined if none exists
   */
  getCredentialForLock(lockId: number): VerifiableCredential | undefined {
    return this.vcs.find((vc) => vc.lockId === lockId);
  }

  /**
   * Returns a string representation of the user
   */
  toString(): string {
    return `User(VCs: ${this.vcs.length})`;
  }
}
