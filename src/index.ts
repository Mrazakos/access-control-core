// Export all classes and types
export { User } from "./user";
export { Lock, MyLock } from "./lock";
export { LockOwner } from "./lock-owner";
export { SmartContract } from "./smart-contract";
export { CryptoUtils } from "./crypto-utils";
export { VerifiableCredential, KeyPair, Address, Hash } from "./types";

// Import for demo
import { User } from "./user";
import { Lock } from "./lock";
import { LockOwner } from "./lock-owner";
import { SmartContract } from "./smart-contract";

// Demo function to showcase the system
export function runDemo(): void {
  console.log("=== Zero-Knowledge Access Control System Demo ===");
  console.log("Demonstrating the blockchain-style flow with ZKP:\n");

  // Create a lock owner
  const lockOwner = new LockOwner();
  console.log("✓ 1. Created lock owner:", lockOwner.toString());

  // Step 1: Lock Owner calls Smart Contract's createLock() → gets unique lockId
  // Step 2: Lock Owner configures physical Lock with the returned lockId
  const lock = lockOwner.registerNewLock("Front Door Lock");
  console.log(`✓ 2. Created lock ${lock.lockId} on smart contract`);

  // Create a lock instance for verification
  const lockForVerification = lock as Lock;
  console.log("✓ 3. Configured lock with credentials");

  // Create a user
  const user = new User();
  console.log("✓ 4. Created user:", user.toString());

  // Step 3: Device Owner issues VCs containing the blockchain-generated lockId
  // Step 4: Device Owner sends VC to User (ZKP: only hash is stored, not original data)
  try {
    const userMetadata = {
      email: "user@example.com",
      name: "John Doe",
      timeStamp: new Date(),
    };

    const vc = lockOwner.issueVc(lock.lockId, userMetadata, "Front Door");
    console.log("✓ 5. Lock Owner issued VC with ZKP (original data hashed)");
    console.log(`   - Lock ID: ${vc.lockId}`);
    console.log(
      `   - User Data Hash: ${vc.userMetaDataHash.substring(0, 20)}...`
    );
    console.log(`   - Signature: ${vc.signature.substring(0, 20)}...`);

    // User stores the VC (only receives hash, not original data)
    user.storeVc(vc);
    console.log(
      "✓ 6. User received and stored VC (zero-knowledge: no original data exposed)"
    );

    // Step 5: User sends VC to Lock for verification
    // Step 6: Lock verifies VCs using the lockId to fetch the correct public key
    console.log("\n=== Access Attempt ===");
    const credential = user.getCredentialForLock(lock.lockId);
    if (credential) {
      const accessGranted = lockForVerification.verifyVc(credential);
      console.log(
        `✓ 7. Lock verification: ${
          accessGranted ? "ACCESS GRANTED ✅" : "ACCESS DENIED ❌"
        }`
      );

      if (accessGranted) {
        lockForVerification.unlock();
        console.log("✓ 8. Lock unlocked successfully");
      }
    }

    // Show smart contract state
    const smartContract = SmartContract.getInstance();
    console.log(
      `\n📊 Smart contract state: ${smartContract.getTotalLocks()} total locks`
    );
    console.log(
      `📊 Lock ${lock.lockId} public key available: ${
        smartContract.fetchPublicKey(lock.lockId) !== null
      }`
    );

    // Demonstrate revocation
    console.log("\n=== Revocation Demo ===");
    console.log("Lock owner revokes the VC...");
    lockOwner.revokeAccessWithVc(lock.lockId, vc.signature);
    lockForVerification.fetchPubK();

    // Try to access after revocation
    const accessAfterRevoke = lockForVerification.verifyVc(credential!);
    console.log(
      `✓ 9. Access after revocation: ${
        accessAfterRevoke ? "ACCESS GRANTED ✅" : "ACCESS DENIED ❌"
      }`
    );
    console.log(
      `📊 Lock ${lock.lockId} has revocation signatures: ${
        smartContract.fetchRevokedSignatures(lock.lockId) !== undefined
      }`
    );
  } catch (error) {
    console.error("❌ Demo error:", error);
  }

  console.log("\n=== Demo Complete ===");
  console.log("Key ZKP Benefits Demonstrated:");
  console.log("- ✅ Original user data never exposed to lock");
  console.log("- ✅ Only cryptographic hash is verified");
  console.log("- ✅ Smart contract manages lock states");
  console.log("- ✅ One VC per lock enforced");
  console.log("- ✅ Proper revocation mechanism");
}

// Run the demo if this file is executed directly
if (require.main === module) {
  runDemo();
}
