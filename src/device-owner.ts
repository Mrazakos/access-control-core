import { Device, MyDevice } from "./device";
import { VerifiableCredential, KeyPair, Address, UserMetaData } from "./types";
import { CryptoUtils } from "./crypto-utils";
import { SmartContract } from "./smart-contract";

/**
 * Represents a device owner in the access control system
 */
export class DeviceOwner {
  public myDevices: MyDevice[];
  public listOfIssuedVcs: VerifiableCredential[];
  public address: Address;

  constructor() {
    this.myDevices = [];
    this.listOfIssuedVcs = [];
    this.address = CryptoUtils.generateAddress();
  }

  /**
   * Registers a new device by generating a key pair and getting lockId from smart contract
   */
  registerNewDevice(nickname: string): Device {
    const keyPair = CryptoUtils.generateKeyPair();
    const smartContract = SmartContract.getInstance();

    const lockId = smartContract.registerLock(keyPair.publicKey, this.address);

    const newDevice = new MyDevice(lockId, keyPair, nickname);
    this.myDevices.push(newDevice);

    console.log(`Registered new device with ID: ${lockId}`);
    console.log(`myDevices: ${this.myDevices.length}`);
    return newDevice;
  }

  /**
   * Issues a verifiable credential for a specific device
   * Signs the userMetadataHash with the device's private key
   */
  issueVc(
    lockId: number,
    userMetadata: UserMetaData,
    lockNickname: string
  ): VerifiableCredential {
    // Find the device
    const device = this.myDevices.find((d) => d.lockId === lockId);

    if (!device) {
      throw new Error(`Device with ID ${lockId} not found`);
    }

    const userMetaDataString = JSON.stringify(userMetadata);

    // Sign the userMetadata with the device's private key
    const { signature, userMetaDataHash } = CryptoUtils.sign(
      userMetaDataString,
      device.privateKey
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
   * Revokes access to a specific device
   * Also revokes it in the smart contract
   */
  revokeAccessWithVc(lockId: number, signature: string): void {
    const device = this.myDevices.find((d) => d.lockId === lockId);

    if (!device) {
      throw new Error(`Device with ID ${lockId} not found`);
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

    console.log(`Revoked access to device ${lockId} with signature ${signature}`);
  }

  /**
   * Gets all devices owned by this device owner
   */
  getMyDevices(): Device[] {
    return [...this.myDevices];
  }

  /**
   * Gets all verifiable credentials issued by this device owner
   */
  getIssuedVcs(): VerifiableCredential[] {
    return [...this.listOfIssuedVcs];
  }

  /**
   * Finds a device by its ID
   */
  findDevice(lockId: number): Device | undefined {
    return this.myDevices.find((d) => d.lockId === lockId);
  }

  /**
   * Returns a string representation of the device owner
   */
  toString(): string {
    return `DeviceOwner(Devices: ${this.myDevices.length}, Issued VCs: ${this.listOfIssuedVcs.length})`;
  }
}
