import { Address, KeyPair, VerifiableCredential } from "./types";
import { CryptoUtils } from "./crypto-utils";
import { SmartContract } from "./smart-contract";

/**
 * Represents a smart device in the access control system
 */
export class Device {
  public lockId: number;
  public pubK: string; // public key

  private revokedSignatures: Set<string>; // Track revoked signatures locally

  constructor(lockId: number, pubK: string) {
    this.lockId = lockId;
    this.pubK = pubK;
    this.revokedSignatures = new Set<string>();
  }

  /**
   * Gets the public key for verification
   */
  getPublicKey(): string {
    return this.pubK;
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

  fetchRevokedSignatures(): void {
    const smartContract = SmartContract.getInstance();
    const revokedSigs = smartContract.fetchRevokedSignatures(this.lockId);
    if (!revokedSigs) {
      console.log(
        `No revoked signatures found for lockId ${this.lockId} or lock not found`
      );
      return;
    }

    revokedSigs.forEach((sig) => this.revokedSignatures.add(sig));
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
    if (!vc) {
      console.log(`VC validation failed: No VC provided`);
      return false;
    }

    if (this.revokedSignatures.has(vc.signature)) {
      console.log(
        `VC validation failed: Signature has been revoked for lock ${this.lockId}`
      );
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

export class MyDevice extends Device {
  public privateKey: string;
  public nickname?: string;

  constructor(lockId: number, keyPair: KeyPair, nickname?: string) {
    super(lockId, keyPair.publicKey);
    this.privateKey = keyPair.privateKey;
    this.nickname = nickname;
  }

  /**
   * Returns a string representation of the device with additional info
   */
  toString(): string {
    const nicknameStr = this.nickname ? `, nickname: ${this.nickname}` : "";
    return `MyDevice(lockId: ${this.lockId}${nicknameStr})`;
  }
}
