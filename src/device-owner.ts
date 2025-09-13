import { Lock, MyLock } from "./lock";
import { VerifiableCredential, KeyPair, Address } from "./types";
import { CryptoUtils } from "./crypto-utils";
import { SmartContract } from "./smart-contract";

/**
 * Represents a device owner in the access control system
 */
export class DeviceOwner {
  public myLocks: MyLock[];
  public listOfIssuedVcs: VerifiableCredential[];
  public address: Address;

  constructor() {
    this.myLocks = [];
    this.listOfIssuedVcs = [];
    this.address = CryptoUtils.generateAddress();
  }

  /**
   * Registers a new lock by generating a key pair and getting lockId from smart contract
   */
  registerNewLock(nickname: string): Lock {
    const keyPair = CryptoUtils.generateKeyPair();
    const smartContract = SmartContract.getInstance();

    const lockId = smartContract.registerLock(keyPair.publicKey, this.address);

    const newLock = new MyLock(lockId, this.address, keyPair, nickname);
    this.myLocks.push(newLock);

    console.log(`Registered new lock with ID: ${lockId}`);
    console.log(`myLocks: ${this.myLocks.length}`);
    return newLock;
  }

  /**
   * Issues a verifiable credential for a specific lock
   * Signs the userMetadataHash with the lock's private key
   */
  issueVc(
    lockId: number,
    userMetadata: string,
    lockNickname: string
  ): VerifiableCredential {
    // Find the lock
    const lock = this.myLocks.find((l) => l.lockId === lockId);

    if (!lock) {
      throw new Error(`Lock with ID ${lockId} not found`);
    }

    if (!lock.isActive) {
      throw new Error(`Lock with ID ${lockId} is not active`);
    }

    // Sign the userMetadata with the lock's private key
    const { signature, userMetaDataHash } = CryptoUtils.sign(
      userMetadata,
      lock.privateKey
    );

    // Create the verifiable credential
    const vc: VerifiableCredential = {
      lockId: lockId,
      lockNickname: lockNickname,
      signature: signature ? signature : "", // should never be empty here
      userMetaDataHash: userMetaDataHash ? userMetaDataHash : "", // should never be empty here
    };

    this.listOfIssuedVcs.push(vc);
    console.log(`Issued VC for lock ${lockId} with nickname "${lockNickname}"`);

    return vc;
  }

  activateLock(lockId: number): void {
    const lock = this.myLocks.find((l) => l.lockId === lockId);
    if (!lock) {
      throw new Error(`Lock with ID ${lockId} not found`);
    }
    const smartContract = SmartContract.getInstance();
    smartContract.activateLock(lockId, this.address);
    lock.activate();
  }

  /**
   * Generates a new key pair for cryptographic operations
   */
  generateKeyPair(): KeyPair {
    return CryptoUtils.generateKeyPair();
  }

  /**
   * Revokes access to a specific lock
   * Also revokes it in the smart contract
   */
  revokeLock(lockId: number): void {
    const lock = this.myLocks.find((l) => l.lockId === lockId);

    if (!lock) {
      throw new Error(`Lock with ID ${lockId} not found`);
    }

    // Deactivate the local lock
    lock.deactivate();

    // Also revoke it in the smart contract
    const smartContract = SmartContract.getInstance();
    smartContract.revokeLock(lockId, this.address);

    console.log(`Revoked access to lock ${lockId}`);
  }

  /**
   * Gets all locks owned by this device owner
   */
  getMyLocks(): Lock[] {
    return [...this.myLocks];
  }

  /**
   * Gets all verifiable credentials issued by this device owner
   */
  getIssuedVcs(): VerifiableCredential[] {
    return [...this.listOfIssuedVcs];
  }

  /**
   * Finds a lock by its ID
   */
  findLock(lockId: number): Lock | undefined {
    return this.myLocks.find((l) => l.lockId === lockId);
  }

  /**
   * Returns a string representation of the device owner
   */
  toString(): string {
    return `DeviceOwner(Locks: ${this.myLocks.length}, Issued VCs: ${this.listOfIssuedVcs.length})`;
  }
}
