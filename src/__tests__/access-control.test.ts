import { User } from "../user";
import { LockOwner } from "../lock-owner";
import { Lock } from "../lock";
import { SmartContract } from "../smart-contract";
import { CryptoUtils } from "../crypto-utils";
import { VerifiableCredential, UserMetaData } from "../types";

describe("Access Control System", () => {
  let lockOwner: LockOwner;
  let user: User;
  let smartContract: SmartContract;

  beforeEach(() => {
    lockOwner = new LockOwner();
    user = new User();
    smartContract = SmartContract.getInstance();
  });

  describe("LockOwner", () => {
    it("should register a new lock", () => {
      const lock = lockOwner.registerNewLock("Test Lock");

      expect(lock).toBeDefined();
      expect(lock.lockId).toBeGreaterThan(0);
      expect(lockOwner.getMyLocks()).toContain(lock);
    });

    it("should issue a verifiable credential", () => {
      const lock = lockOwner.registerNewLock("Test Lock");

      const userMetadata: UserMetaData = {
        email: "test@example.com",
        name: "Test User",
        timeStamp: new Date(),
      };

      const vc = lockOwner.issueVc(lock.lockId, userMetadata, "Test Lock");

      expect(vc).toBeDefined();
      expect(vc.lockId).toBe(lock.lockId);
      expect(vc.lockNickname).toBe("Test Lock");
      expect(vc.userMetaDataHash).toBeDefined();
      expect(vc.signature).toBeDefined();
      expect(lockOwner.getIssuedVcs()).toContain(vc);
    });

    it("should revoke access with VC", () => {
      const lock = lockOwner.registerNewLock("Test lock");

      const userMetadata: UserMetaData = {
        email: "test@example.com",
        timeStamp: new Date(),
      };

      const vc = lockOwner.issueVc(lock.lockId, userMetadata, "Test lock");

      // Initially the VC should be in the issued VCs list
      expect(lockOwner.getIssuedVcs()).toContain(vc);

      // Revoke access using the VC signature
      lockOwner.revokeAccessWithVc(lock.lockId, vc.signature);

      // After revocation, the VC should be removed from issued VCs list
      expect(lockOwner.getIssuedVcs()).not.toContain(vc);
    });

    it("should throw error when issuing VC for non-existent lock", () => {
      const userMetadata: UserMetaData = {
        email: "test@example.com",
        timeStamp: new Date(),
      };

      expect(() => {
        lockOwner.issueVc(999999, userMetadata, "Non-existent lock");
      }).toThrow("lock with ID 999999 not found");
    });

    it("should throw error when revoking with non-existent signature", () => {
      const lock = lockOwner.registerNewLock("Test lock");

      expect(() => {
        lockOwner.revokeAccessWithVc(lock.lockId, "non-existent-signature");
      }).toThrow("VC with signature non-existent-signature not found");
    });
  });

  describe("User", () => {
    it("should store a verifiable credential", () => {
      const lock = lockOwner.registerNewLock("Test lock");

      const userMetadata: UserMetaData = {
        email: "test@example.com",
        timeStamp: new Date(),
      };

      const vc = lockOwner.issueVc(lock.lockId, userMetadata, "Test lock");

      user.storeVc(vc);

      expect(user.vcs).toContain(vc);
      expect(user.getCredentialForLock(lock.lockId)).toBe(vc);
    });

    it("should replace existing credential for the same lock", () => {
      const lock = lockOwner.registerNewLock("Test lock");

      const userMetadata1: UserMetaData = {
        email: "test@example.com",
        timeStamp: new Date(),
      };

      const vc1 = lockOwner.issueVc(lock.lockId, userMetadata1, "Test lock 1");
      user.storeVc(vc1);

      const userMetadata2: UserMetaData = {
        email: "test@example.com",
        timeStamp: new Date(),
      };

      const vc2 = lockOwner.issueVc(lock.lockId, userMetadata2, "Test lock 2");
      user.storeVc(vc2);

      expect(user.getCredentialForLock(lock.lockId)).toBe(vc2);
      expect(user.vcs).toHaveLength(1);
    });

    it("should return undefined for non-existent lock credential", () => {
      const lock = lockOwner.registerNewLock("Test lock");

      expect(user.getCredentialForLock(lock.lockId)).toBeUndefined();
    });
  });

  describe("lock", () => {
    it("should verify valid VC", () => {
      const lock = lockOwner.registerNewLock("Test lock");

      const userMetadata: UserMetaData = {
        email: "test@example.com",
        timeStamp: new Date(),
      };

      const vc = lockOwner.issueVc(lock.lockId, userMetadata, "Test lock");
      const testlock = new Lock(lock.lockId, lock.pubK);

      const isValid = testlock.verifyVc(vc);

      expect(isValid).toBe(true);
    });

    it("should reject invalid VC", () => {
      const lock = lockOwner.registerNewLock("Test lock");
      const testlock = new Lock(lock.lockId, lock.pubK);

      const invalidVc: VerifiableCredential = {
        lockId: 999999, // Different lock ID
        userMetaDataHash: "invalidhash",
        lockNickname: "Invalid",
        signature: "invalid",
      };

      const isValid = testlock.verifyVc(invalidVc);

      expect(isValid).toBe(false);
    });

    it("should reject VC with revoked signature", () => {
      const lock = lockOwner.registerNewLock("Test lock");

      const userMetadata: UserMetaData = {
        email: "test@example.com",
        timeStamp: new Date(),
      };

      const vc = lockOwner.issueVc(lock.lockId, userMetadata, "Test lock");

      // Initially, the VC should be valid
      const testlock = new Lock(lock.lockId, lock.pubK);
      expect(testlock.verifyVc(vc)).toBe(true);

      // Revoke the VC
      lockOwner.revokeAccessWithVc(lock.lockId, vc.signature);

      testlock.fetchRevokedSignatures();

      // After revocation, the VC should be invalid
      expect(testlock.verifyVc(vc)).toBe(false);
    });
  });

  describe("SmartContract", () => {
    it("should register a lock", () => {
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

      // lock should still be accessible
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
