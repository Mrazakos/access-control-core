import { User } from "../user";
import { DeviceOwner } from "../device-owner";
import { Device } from "../device";
import { SmartContract } from "../smart-contract";
import { CryptoUtils } from "../crypto-utils";
import { VerifiableCredential } from "../types";

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
    it("should register a new lock", () => {
      const lock = deviceOwner.registerNewLock("Test Lock");

      expect(lock).toBeDefined();
      expect(lock.lockId).toBeGreaterThan(0);
      expect(lock.isActive).toBe(true);
      expect(deviceOwner.getMyLocks()).toContain(lock);
    });

    it("should issue a verifiable credential", () => {
      const lock = deviceOwner.registerNewLock("Test Lock");

      const vc = deviceOwner.issueVc(
        lock.lockId,
        "test@example.com",
        "Test Lock"
      );

      expect(vc).toBeDefined();
      expect(vc.lockId).toBe(lock.lockId);
      expect(vc.lockNickname).toBe("Test Lock");
      expect(vc.userMetaDataHash).toBeDefined();
      expect(vc.signature).toBeDefined();
      expect(deviceOwner.getIssuedVcs()).toContain(vc);
    });

    it("should revoke a lock", () => {
      const lock = deviceOwner.registerNewLock("Test Lock");

      expect(lock.isActive).toBe(true);

      deviceOwner.revokeLock(lock.lockId);

      expect(lock.isActive).toBe(false);
    });

    it("should throw error when issuing VC for non-existent lock", () => {
      expect(() => {
        deviceOwner.issueVc(999999, "test@example.com", "Non-existent Lock");
      }).toThrow("Lock with ID 999999 not found");
    });
  });

  describe("User", () => {
    it("should store a verifiable credential", () => {
      const lock = deviceOwner.registerNewLock("Test Lock");
      const vc = deviceOwner.issueVc(
        lock.lockId,
        "test@example.com",
        "Test Lock"
      );

      user.storeVc(vc);

      expect(user.vcs).toContain(vc);
      expect(user.getCredentialForLock(lock.lockId)).toBe(vc);
    });

    it("should replace existing credential for the same lock", () => {
      const lock = deviceOwner.registerNewLock("Test Lock");

      const vc1 = deviceOwner.issueVc(
        lock.lockId,
        "test@example.com",
        "Test Lock 1"
      );
      user.storeVc(vc1);

      const vc2 = deviceOwner.issueVc(
        lock.lockId,
        "test@example.com",
        "Test Lock 2"
      );
      user.storeVc(vc2);

      expect(user.getCredentialForLock(lock.lockId)).toBe(vc2);
      expect(user.vcs).toHaveLength(1);
    });

    it("should return undefined for non-existent lock credential", () => {
      const lock = deviceOwner.registerNewLock("Test Lock");

      expect(user.getCredentialForLock(lock.lockId)).toBeUndefined();
    });
  });

  describe("Device", () => {
    it("should verify valid VC", () => {
      const lock = deviceOwner.registerNewLock("Test Lock");
      const vc = deviceOwner.issueVc(
        lock.lockId,
        "test@example.com",
        "Test Lock"
      );
      const device = new Device(lock.lockId, lock.publicKey);

      const isValid = device.verifyVc(vc);

      expect(isValid).toBe(true);
    });

    it("should reject invalid VC", () => {
      const lock = deviceOwner.registerNewLock("Test Lock");
      const device = new Device(lock.lockId, lock.publicKey);

      const invalidVc: VerifiableCredential = {
        lockId: 999999, // Different lock ID
        userMetaDataHash: "invalidhash",
        lockNickname: "Invalid",
        signature: "invalid",
      };

      const isValid = device.verifyVc(invalidVc);

      expect(isValid).toBe(false);
    });
  });

  describe("SmartContract", () => {
    it("should register a lock", () => {
      const keyPair = CryptoUtils.generateKeyPair();
      const owner = CryptoUtils.generateAddress();

      const lockId = smartContract.registerLock(keyPair.publicKey, owner);

      expect(lockId).toBeGreaterThan(0);
      expect(smartContract.isLockActive(lockId)).toBe(true);
      expect(smartContract.isOwner(owner, lockId)).toBe(true);
    });

    it("should revoke a lock", () => {
      const keyPair = CryptoUtils.generateKeyPair();
      const owner = CryptoUtils.generateAddress();

      const lockId = smartContract.registerLock(keyPair.publicKey, owner);
      expect(smartContract.isLockActive(lockId)).toBe(true);

      smartContract.revokeLock(lockId, owner);
      expect(smartContract.isLockActive(lockId)).toBe(false);
    });

    it("should only allow owner to revoke a lock", () => {
      const keyPair = CryptoUtils.generateKeyPair();
      const owner = CryptoUtils.generateAddress();
      const notOwner = CryptoUtils.generateAddress();

      const lockId = smartContract.registerLock(keyPair.publicKey, owner);
      expect(smartContract.isLockActive(lockId)).toBe(true);

      // Non-owner should not be able to revoke
      expect(() => {
        smartContract.revokeLock(lockId, notOwner);
      }).toThrow(`Address ${notOwner} is not the owner of lock ${lockId}`);

      // Lock should still be active
      expect(smartContract.isLockActive(lockId)).toBe(true);

      // Owner should be able to revoke
      smartContract.revokeLock(lockId, owner);
      expect(smartContract.isLockActive(lockId)).toBe(false);
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
