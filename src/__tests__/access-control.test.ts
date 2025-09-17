import { User } from "../user";
import { DeviceOwner } from "../device-owner";
import { Device } from "../device";
import { SmartContract } from "../smart-contract";
import { CryptoUtils } from "../crypto-utils";
import { VerifiableCredential, UserMetaData } from "../types";

describe("Access Control System", () => {
  let deviceOwner: DeviceOwner;
  let user: User;
  let smartContract: SmartContract;

  beforeEach(() => {
    deviceOwner = new DeviceOwner();
    user = new User();
    smartContract = SmartContract.getInstance();
  });

  describe("DeviceOwner", () => {
    it("should register a new device", () => {
      const device = deviceOwner.registerNewDevice("Test Device");

      expect(device).toBeDefined();
      expect(device.lockId).toBeGreaterThan(0);
      expect(deviceOwner.getMyDevices()).toContain(device);
    });

    it("should issue a verifiable credential", () => {
      const device = deviceOwner.registerNewDevice("Test Device");

      const userMetadata: UserMetaData = {
        email: "test@example.com",
        name: "Test User",
        timeStamp: new Date(),
      };

      const vc = deviceOwner.issueVc(
        device.lockId,
        userMetadata,
        "Test Device"
      );

      expect(vc).toBeDefined();
      expect(vc.lockId).toBe(device.lockId);
      expect(vc.lockNickname).toBe("Test Device");
      expect(vc.userMetaDataHash).toBeDefined();
      expect(vc.signature).toBeDefined();
      expect(deviceOwner.getIssuedVcs()).toContain(vc);
    });

    it("should revoke access with VC", () => {
      const device = deviceOwner.registerNewDevice("Test Device");

      const userMetadata: UserMetaData = {
        email: "test@example.com",
        timeStamp: new Date(),
      };

      const vc = deviceOwner.issueVc(
        device.lockId,
        userMetadata,
        "Test Device"
      );

      // Initially the VC should be in the issued VCs list
      expect(deviceOwner.getIssuedVcs()).toContain(vc);

      // Revoke access using the VC signature
      deviceOwner.revokeAccessWithVc(device.lockId, vc.signature);

      // After revocation, the VC should be removed from issued VCs list
      expect(deviceOwner.getIssuedVcs()).not.toContain(vc);
    });

    it("should throw error when issuing VC for non-existent device", () => {
      const userMetadata: UserMetaData = {
        email: "test@example.com",
        timeStamp: new Date(),
      };

      expect(() => {
        deviceOwner.issueVc(999999, userMetadata, "Non-existent Device");
      }).toThrow("Device with ID 999999 not found");
    });

    it("should throw error when revoking with non-existent signature", () => {
      const device = deviceOwner.registerNewDevice("Test Device");

      expect(() => {
        deviceOwner.revokeAccessWithVc(device.lockId, "non-existent-signature");
      }).toThrow("VC with signature non-existent-signature not found");
    });
  });

  describe("User", () => {
    it("should store a verifiable credential", () => {
      const device = deviceOwner.registerNewDevice("Test Device");

      const userMetadata: UserMetaData = {
        email: "test@example.com",
        timeStamp: new Date(),
      };

      const vc = deviceOwner.issueVc(
        device.lockId,
        userMetadata,
        "Test Device"
      );

      user.storeVc(vc);

      expect(user.vcs).toContain(vc);
      expect(user.getCredentialForLock(device.lockId)).toBe(vc);
    });

    it("should replace existing credential for the same device", () => {
      const device = deviceOwner.registerNewDevice("Test Device");

      const userMetadata1: UserMetaData = {
        email: "test@example.com",
        timeStamp: new Date(),
      };

      const vc1 = deviceOwner.issueVc(
        device.lockId,
        userMetadata1,
        "Test Device 1"
      );
      user.storeVc(vc1);

      const userMetadata2: UserMetaData = {
        email: "test@example.com",
        timeStamp: new Date(),
      };

      const vc2 = deviceOwner.issueVc(
        device.lockId,
        userMetadata2,
        "Test Device 2"
      );
      user.storeVc(vc2);

      expect(user.getCredentialForLock(device.lockId)).toBe(vc2);
      expect(user.vcs).toHaveLength(1);
    });

    it("should return undefined for non-existent device credential", () => {
      const device = deviceOwner.registerNewDevice("Test Device");

      expect(user.getCredentialForLock(device.lockId)).toBeUndefined();
    });
  });

  describe("Device", () => {
    it("should verify valid VC", () => {
      const device = deviceOwner.registerNewDevice("Test Device");

      const userMetadata: UserMetaData = {
        email: "test@example.com",
        timeStamp: new Date(),
      };

      const vc = deviceOwner.issueVc(
        device.lockId,
        userMetadata,
        "Test Device"
      );
      const testDevice = new Device(device.lockId, device.pubK);

      const isValid = testDevice.verifyVc(vc);

      expect(isValid).toBe(true);
    });

    it("should reject invalid VC", () => {
      const device = deviceOwner.registerNewDevice("Test Device");
      const testDevice = new Device(device.lockId, device.pubK);

      const invalidVc: VerifiableCredential = {
        lockId: 999999, // Different lock ID
        userMetaDataHash: "invalidhash",
        lockNickname: "Invalid",
        signature: "invalid",
      };

      const isValid = testDevice.verifyVc(invalidVc);

      expect(isValid).toBe(false);
    });

    it("should reject VC with revoked signature", () => {
      const device = deviceOwner.registerNewDevice("Test Device");

      const userMetadata: UserMetaData = {
        email: "test@example.com",
        timeStamp: new Date(),
      };

      const vc = deviceOwner.issueVc(
        device.lockId,
        userMetadata,
        "Test Device"
      );

      // Initially, the VC should be valid
      const testDevice = new Device(device.lockId, device.pubK);
      expect(testDevice.verifyVc(vc)).toBe(true);

      // Revoke the VC
      deviceOwner.revokeAccessWithVc(device.lockId, vc.signature);

      testDevice.fetchRevokedSignatures();

      // After revocation, the VC should be invalid
      expect(testDevice.verifyVc(vc)).toBe(false);
    });
  });

  describe("SmartContract", () => {
    it("should register a device", () => {
      const keyPair = CryptoUtils.generateKeyPair();
      const owner = CryptoUtils.generateAddress();

      const lockId = smartContract.registerLock(keyPair.publicKey, owner);

      expect(lockId).toBeGreaterThan(0);
      expect(smartContract.fetchPublicKey(lockId)).toBe(keyPair.publicKey);
      expect(smartContract.isOwner(owner, lockId)).toBe(true);
    });

    it("should revoke a signature", () => {
      const keyPair = CryptoUtils.generateKeyPair();
      const owner = CryptoUtils.generateAddress();

      const lockId = smartContract.registerLock(keyPair.publicKey, owner);
      expect(smartContract.fetchPublicKey(lockId)).toBe(keyPair.publicKey);

      smartContract.revokeSignature(lockId, "revocation_signature", owner);
      expect(smartContract.fetchRevokedSignatures(lockId)).toContain(
        "revocation_signature"
      );
    });

    it("should only allow owner to revoke a signature", () => {
      const keyPair = CryptoUtils.generateKeyPair();
      const owner = CryptoUtils.generateAddress();
      const notOwner = CryptoUtils.generateAddress();

      const lockId = smartContract.registerLock(keyPair.publicKey, owner);
      expect(smartContract.fetchPublicKey(lockId)).toBe(keyPair.publicKey);

      // Non-owner should not be able to revoke
      expect(() => {
        smartContract.revokeSignature(lockId, "revocation_signature", notOwner);
      }).toThrow(`Address ${notOwner} is not the owner of lock ${lockId}`);

      // Device should still be accessible
      expect(smartContract.fetchPublicKey(lockId)).toBe(keyPair.publicKey);

      // Owner should be able to revoke
      smartContract.revokeSignature(lockId, "revocation_signature", owner);
      expect(smartContract.fetchRevokedSignatures(lockId)).toContain(
        "revocation_signature"
      );
    });

    it("should transfer ownership", () => {
      const keyPair = CryptoUtils.generateKeyPair();
      const owner1 = CryptoUtils.generateAddress();
      const owner2 = CryptoUtils.generateAddress();

      const lockId = smartContract.registerLock(keyPair.publicKey, owner1);

      expect(smartContract.isOwner(owner1, lockId)).toBe(true);
      expect(smartContract.isOwner(owner2, lockId)).toBe(false);

      smartContract.transferOwnership(lockId, owner1, owner2);

      expect(smartContract.isOwner(owner1, lockId)).toBe(false);
      expect(smartContract.isOwner(owner2, lockId)).toBe(true);
    });
  });

  describe("CryptoUtils", () => {
    it("should generate key pairs", () => {
      const keyPair = CryptoUtils.generateKeyPair();

      expect(keyPair.privateKey).toBeDefined();
      expect(keyPair.publicKey).toBeDefined();
      expect(keyPair.privateKey.length).toBeGreaterThan(0);
      expect(keyPair.publicKey.length).toBeGreaterThan(0);
    });

    it("should generate unique addresses", () => {
      const addr1 = CryptoUtils.generateAddress();
      const addr2 = CryptoUtils.generateAddress();

      expect(addr1).not.toBe(addr2);
      expect(addr1.startsWith("addr_")).toBe(true);
      expect(addr2.startsWith("addr_")).toBe(true);
    });
  });
});
