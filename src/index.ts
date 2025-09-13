// Export all classes and types
export { User } from "./user";
export { Device } from "./device";
export { Lock } from "./lock";
export { DeviceOwner } from "./device-owner";
export { SmartContract } from "./smart-contract";
export { CryptoUtils } from "./crypto-utils";
export { VerifiableCredential, KeyPair, Address, Hash } from "./types";

// Import for demo
import { User } from "./user";
import { Device } from "./device";
import { Lock } from "./lock";
import { DeviceOwner } from "./device-owner";
import { SmartContract } from "./smart-contract";

// Demo function to showcase the system
export function runDemo(): void {
  console.log("=== Zero-Knowledge Access Control System Demo ===");
  console.log("Demonstrating the blockchain-style flow with ZKP:\n");

  // Create a device owner
  const deviceOwner = new DeviceOwner();
  console.log("✓ 1. Created device owner:", deviceOwner.toString());

  // Step 1: Device Owner calls Smart Contract's createLock() → gets unique lockId
  // Step 2: Device Owner configures physical Device with the returned lockId
  const lock = deviceOwner.registerNewLock("Front Door Lock");
  console.log(`✓ 2. Created lock ${lock.lockId} on smart contract`);

  // Create a device with the lock's public key
  const device = new Device(lock.lockId, lock.getPublicKey());
  console.log("✓ 3. Configured device with lock credentials");

  // Create a user
  const user = new User();
  console.log("✓ 4. Created user:", user.toString());

  // Step 3: Device Owner issues VCs containing the blockchain-generated lockId
  // Step 4: Device Owner sends VC to User (ZKP: only hash is stored, not original data)
  try {
    const userMetadata = "user@example.com";
    const vc = deviceOwner.issueVc(lock.lockId, userMetadata, "Front Door");
    console.log("✓ 5. Device Owner issued VC with ZKP (original data hashed)");
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

    // Step 5: User sends VC to Device for verification
    // Step 6: Device verifies VCs using the lockId to fetch the correct public key
    console.log("\n=== Access Attempt ===");
    const credential = user.getCredentialForLock(lock.lockId);
    if (credential) {
      const accessGranted = device.verifyVc(credential);
      console.log(
        `✓ 7. Device verification: ${
          accessGranted ? "ACCESS GRANTED ✅" : "ACCESS DENIED ❌"
        }`
      );

      if (accessGranted) {
        device.unlock();
        console.log("✓ 8. Device unlocked successfully");
      }
    }

    // Show smart contract state
    const smartContract = SmartContract.getInstance();
    console.log(
      `\n📊 Smart contract state: ${smartContract.getTotalLocks()} total locks`
    );
    console.log(
      `📊 Lock ${lock.lockId} active: ${smartContract.isLockActive(
        lock.lockId
      )}`
    );

    // Demonstrate revocation
    console.log("\n=== Revocation Demo ===");
    console.log("Device owner revokes the lock...");
    deviceOwner.revokeLock(lock.lockId);
    device.fetchPubK();

    // Try to access after revocation
    const accessAfterRevoke = device.verifyVc(credential!);
    console.log(
      `✓ 9. Access after revocation: ${
        accessAfterRevoke ? "ACCESS GRANTED ✅" : "ACCESS DENIED ❌"
      }`
    );
    console.log(
      `📊 Lock ${
        lock.lockId
      } active after revocation: ${smartContract.isLockActive(lock.lockId)}`
    );
    deviceOwner.activateLock(lock.lockId);
    console.log(
      `📊 Lock ${
        lock.lockId
      } active after reactivation: ${smartContract.isLockActive(lock.lockId)}`
    );

    // Demonstrate issuing new VC for same lock (should replace old one)
    console.log("\n=== Replacing VC Demo ===");
    const newVc = deviceOwner.issueVc(
      lock.lockId,
      "newuser@example.com",
      "Front Door - Updated"
    );
    user.storeVc(newVc);
    console.log("✓ 10. Issued new VC for same lock (replaces previous VC)");
    console.log(
      `✓ User now has ${user.vcs.length} VC(s) total (enforcing 1 VC per lock)`
    );
  } catch (error) {
    console.error("❌ Demo error:", error);
  }

  console.log("\n=== Demo Complete ===");
  console.log("Key ZKP Benefits Demonstrated:");
  console.log("- ✅ Original user data never exposed to device");
  console.log("- ✅ Only cryptographic hash is verified");
  console.log("- ✅ Smart contract manages lock states");
  console.log("- ✅ One VC per lock enforced");
  console.log("- ✅ Proper revocation mechanism");
}

// Run the demo if this file is executed directly
if (require.main === module) {
  runDemo();
}
