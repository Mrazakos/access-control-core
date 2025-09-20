import { Lock, MyLock } from "./lock";
import { VerifiableCredential, KeyPair, Address, UserMetaData } from "./types";
import { CryptoUtils } from "./crypto-utils";
import { SmartContract } from "./smart-contract";

/**
 * Represents a lock owner in the access control system
 */
export class LockOwner {
  public myLocks: MyLock[];
  public listOfIssuedVcs: VerifiableCredential[];
  public address: Address;

  constructor() {
    this.myLocks = [];
    this.listOfIssuedVcs = [];
    this.address = CryptoUtils.generateAddress();
  }

  /**
   * Registers a new smart lock by generating a key pair and getting lockId from smart contract
   */
  registerNewLock(nickname: string): Lock {
    const keyPair = CryptoUtils.generateKeyPair();
    const smartContract = SmartContract.getInstance();

    const lockId = smartContract.registerLock(keyPair.publicKey, this.address);

    const newLock = new MyLock(lockId, keyPair, nickname);
    this.myLocks.push(newLock);

    console.log(`Registered new smart lock with ID: ${lockId}`);
    console.log(`myLocks: ${this.myLocks.length}`);
    return newLock;
  }

  /**
   * Issues a verifiable credential for a specific smart lock
   * Signs the userMetadataHash with the lock's private key
   */
  issueVc(
    lockId: number,
    userMetadata: UserMetaData,
    lockNickname: string
  ): VerifiableCredential {
    // Find the smart lock
    const lock = this.myLocks.find((l) => l.lockId === lockId);

    if (!lock) {
      throw new Error(`Smart lock with ID ${lockId} not found`);
    }

    const userMetaDataString = JSON.stringify(userMetadata);

    // Sign the userMetadata with the lock's private key
    const { signature, userMetaDataHash } = CryptoUtils.sign(
      userMetaDataString,
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

  /**
   * Generates a new key pair for cryptographic operations
   */
  generateKeyPair(): KeyPair {
    return CryptoUtils.generateKeyPair();
  }

  /**
   * Revokes access to a specific smart lock
   * Also revokes it in the smart contract
   */
  revokeAccessWithVc(lockId: number, signature: string): void {
    const lock = this.myLocks.find((l) => l.lockId === lockId);

    if (!lock) {
      throw new Error(`Smart lock with ID ${lockId} not found`);
    }

    const vc = this.listOfIssuedVcs.find((v) => v.signature === signature);
    if (!vc) {
      throw new Error(`VC with signature ${signature} not found`);
    }

    // Revoke the VC
    this.listOfIssuedVcs = this.listOfIssuedVcs.filter((v) => v !== vc);

    // Also revoke it in the smart contract - need to provide signature parameter
    const smartContract = SmartContract.getInstance();
    smartContract.revokeSignature(lockId, signature, this.address);

    console.log(`Revoked access to lock ${lockId} with signature ${signature}`);
  }

  /**
   * Gets all locks owned by this lock owner
   */
  getMyLocks(): Lock[] {
    return [...this.myLocks];
  }

  /**
   * Gets all verifiable credentials issued by this lock owner
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
   * Returns a string representation of the lock owner
   */
  toString(): string {
    return `LockOwner(Locks: ${this.myLocks.length}, Issued VCs: ${this.listOfIssuedVcs.length})`;
  }
}
