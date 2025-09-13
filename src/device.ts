import { VerifiableCredential } from "./types";
import { CryptoUtils } from "./crypto-utils";
import { SmartContract } from "./smart-contract";

/**
 * Represents a device in the access control system
 */
export class Device {
  public lockId: number;
  public pubK: string; // public key

  constructor(lockId: number, pubK: string) {
    this.lockId = lockId;
    this.pubK = pubK;
  }

  /**
   * Fetches the public key of the device from the smart contract
   * Handles inactive locks by returning false if lock is revoked
   */
  fetchPubK(): boolean {
    const smartContract = SmartContract.getInstance();
    const fetchedPubK = smartContract.fetchPublicKey(this.lockId);

    if (!fetchedPubK) {
      console.log(
        `Failed to fetch public key for lockId ${this.lockId} - lock may be inactive or not found`
      );
      return false;
    }

    this.pubK = fetchedPubK;
    console.log(
      `Successfully fetched public key for device with lockId: ${this.lockId}`
    );
    return true;
  }

  /**
   * Unlocks the device
   */
  unlock(): void {
    console.log(`Device with lockId ${this.lockId} has been unlocked`);
  }

  /**
   * Sets the lock ID for the device
   */
  setLockId(lockId: number): void {
    this.lockId = lockId;
    console.log(`Device lock ID set to: ${lockId}`);
  }

  /**
   * Verifies a verifiable credential against this device
   * Checks that the VC is for this lock, that the lock is still active, and that the signature is valid
   */
  verifyVc(vc: VerifiableCredential): boolean {
    // Check if VC exists and is for this lock
    if (!vc || !vc.lockId || vc.lockId !== this.lockId) {
      console.log(`VC validation failed: Invalid VC or lockId mismatch`);
      return false;
    }

    // Check if the lock is still active using the smart contract
    const smartContract = SmartContract.getInstance();
    if (!smartContract.isLockActive(this.lockId)) {
      console.log(
        `VC validation failed: Lock ${this.lockId} is inactive/revoked`
      );
      return false;
    }

    // Refresh public key to ensure we have the latest valid key
    if (!this.fetchPubK()) {
      console.log(`VC validation failed: Could not fetch valid public key`);
      return false;
    }

    // Verify the signature using the lock's public key
    // The signature should be of the userMetaDataHash
    const isValidSignature = CryptoUtils.verify(
      vc.userMetaDataHash, // This is the hashed user metadata
      vc.signature,
      this.pubK // This device's public key (should match the lock's public key)
    );

    if (isValidSignature) {
      console.log(`VC validation successful for lock ${this.lockId}`);
    } else {
      console.log(
        `VC validation failed: Invalid signature for lock ${this.lockId}`
      );
    }

    return isValidSignature;
  }

  /**
   * Returns a string representation of the device
   */
  toString(): string {
    return `Device(lockId: ${this.lockId}, pubK: ${this.pubK.substring(
      0,
      8
    )}...)`;
  }
}
