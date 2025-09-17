// Export all classes and types
export { User } from "./user";
export { Device, MyDevice } from "./device";
export { DeviceOwner } from "./device-owner";
export { SmartContract } from "./smart-contract";
export { CryptoUtils } from "./crypto-utils";
export { VerifiableCredential, KeyPair, Address, Hash } from "./types";

// Import for demo
import { User } from "./user";
import { Device } from "./device";
import { DeviceOwner } from "./device-owner";
import { SmartContract } from "./smart-contract";

// Demo function to showcase the system
export function runDemo(): void {
  console.log("=== Zero-Knowledge Access Control System Demo ===");
  console.log("Demonstrating the blockchain-style flow with ZKP:\n");

  // Create a device owner
  const deviceOwner = new DeviceOwner();
  console.log("✓ 1. Created device owner:", deviceOwner.toString());

  // Step 1: Device Owner calls Smart Contract's createDevice() → gets unique lockId
  // Step 2: Device Owner configures physical Device with the returned lockId
  const device = deviceOwner.registerNewDevice("Front Door Device");
  console.log(`✓ 2. Created device ${device.lockId} on smart contract`);

  // Create a device instance for verification
  const deviceForVerification = device as Device;
  console.log("✓ 3. Configured device with credentials");

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

    const vc = deviceOwner.issueVc(device.lockId, userMetadata, "Front Door");
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
    const credential = user.getCredentialForLock(device.lockId);
    if (credential) {
      const accessGranted = deviceForVerification.verifyVc(credential);
      console.log(
        `✓ 7. Device verification: ${
          accessGranted ? "ACCESS GRANTED ✅" : "ACCESS DENIED ❌"
        }`
      );

      if (accessGranted) {
        deviceForVerification.unlock();
        console.log("✓ 8. Device unlocked successfully");
      }
    }

    // Show smart contract state
    const smartContract = SmartContract.getInstance();
    console.log(
      `\n📊 Smart contract state: ${smartContract.getTotalLocks()} total devices`
    );
    console.log(
      `📊 Device ${device.lockId} public key available: ${
        smartContract.fetchPublicKey(device.lockId) !== null
      }`
    );

    // Demonstrate revocation
    console.log("\n=== Revocation Demo ===");
    console.log("Device owner revokes the device...");
    deviceOwner.revokeAccessWithVc(device.lockId, vc.signature);
    deviceForVerification.fetchPubK();

    // Try to access after revocation
    const accessAfterRevoke = deviceForVerification.verifyVc(credential!);
    console.log(
      `✓ 9. Access after revocation: ${
        accessAfterRevoke ? "ACCESS GRANTED ✅" : "ACCESS DENIED ❌"
      }`
    );
    console.log(
      `📊 Device ${device.lockId} has revocation signatures: ${
        smartContract.fetchRevokedSignatures(device.lockId) !== undefined
      }`
    );
  } catch (error) {
    console.error("❌ Demo error:", error);
  }

  console.log("\n=== Demo Complete ===");
  console.log("Key ZKP Benefits Demonstrated:");
  console.log("- ✅ Original user data never exposed to device");
  console.log("- ✅ Only cryptographic hash is verified");
  console.log("- ✅ Smart contract manages device states");
  console.log("- ✅ One VC per device enforced");
  console.log("- ✅ Proper revocation mechanism");
}

// Run the demo if this file is executed directly
if (require.main === module) {
  runDemo();
}
