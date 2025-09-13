# Access Control Core

A TypeScript proof of concept for a decentralized Access Control System with Zero-Knowledge Proof verification. This implementation demonstrates the core concepts of a blockchain-based access control system with verifiable credentials, smart locks, and secure device management.

## Architecture

The system implements a zero-knowledge proof (ZKP) architecture where devices verify user credentials without ever seeing the original user data, ensuring maximum privacy and security.

### Core Flow

1. **Device Owner** calls Smart Contract's `createLock()` → gets unique lockId
2. **Device Owner** configures physical Device with lockId and public key
3. **Device Owner** issues Verifiable Credentials (VCs) to authorized users
4. **User** sends VC to Lock/Device for access
5. **Device** verifies VC using only data hashes (zero-knowledge verification)

### Core Classes

- **User**: Manages verifiable credentials with 1-VC-per-lock constraint
- **Device**: Smart lock devices that verify credentials using ZKP principles
- **Lock**: Physical/digital locks with RSA key pairs and ownership tracking
- **DeviceOwner**: Issues verifiable credentials and manages lock lifecycle
- **SmartContract**: Singleton managing global lock state and ownership validation
- **CryptoUtils**: RSA-2048 cryptographic operations with object signing support

### Key Features

- **Zero-Knowledge Proof Verification**: Devices verify credentials without accessing original user data
- **1-VC-per-Lock Constraint**: Each user can only have one active credential per lock
- **Owner-Only Revocation**: Only lock owners can revoke their locks
- **Hash-Based Signatures**: VCs contain signed hashes of user metadata for privacy
- **Active Lock Validation**: Automatic checking of lock status during verification
- **RSA-2048 Encryption**: Production-ready cryptographic implementation

## Installation

1. Clone the repository and navigate to the project directory
2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

## Usage

### Running the Demo

To see the complete ZKP access control flow in action:

```bash
npm run dev
```

Or to run the compiled version:
```bash
npm start
```

The demo showcases:
- Device owner registering a new lock via smart contract
- Physical device configuration with lock credentials
- Issuing verifiable credentials with hash-based signatures
- Zero-knowledge proof verification (device never sees original user data)
- Lock revocation and security validation

### Running Tests

```bash
npm test
```

The comprehensive test suite covers:
- Lock registration and management with proper ownership
- Zero-knowledge proof credential verification
- 1-VC-per-lock constraint enforcement
- Owner-only revocation security
- Active lock validation during verification
- RSA cryptographic operations

## Example Usage

```typescript
import { DeviceOwner, User, Device, SmartContract } from './src/index';

// Create a device owner
const deviceOwner = new DeviceOwner();

// Register a new lock through smart contract (gets unique lockId)
const lock = deviceOwner.registerNewLock("Front Door Lock");

// Issue a verifiable credential with zero-knowledge proof
const user = new User();
const vc = deviceOwner.issueVc(lock.lockId, 'user@example.com', 'Front Door Access');

// User stores the credential (enforces 1-VC-per-lock)
user.storeVc(vc);

// Device verifies using ZKP - only sees the hash, not original data
const device = new Device(lock.lockId, lock.publicKey);
const isValidCredential = device.verifyVc(vc);

console.log('ZKP Verification Result:', isValidCredential);

// Owner can revoke access (only owner can revoke)
deviceOwner.revokeLock(lock.lockId);

// Verification now fails for revoked lock
const isStillValid = device.verifyVc(vc);
console.log('After revocation:', isStillValid); // false
```

## Zero-Knowledge Proof Implementation

The system implements ZKP principles where:

1. **User metadata is hashed** before being signed
2. **Devices only receive the hash** in the VerifiableCredential
3. **Original user data never leaves the issuer** (DeviceOwner)
4. **Verification uses only the hash** and signature validation
5. **Privacy is maintained** while ensuring security

### VerifiableCredential Structure

```typescript
interface VerifiableCredential {
  lockId: number;
  userMetaDataHash: string;  // SHA-256 hash of user data (ZKP)
  lockNickname: string;
  signature: string;         // RSA signature of the hash
}
```

## Project Structure

```
src/
├── types.ts                 # Type definitions (VerifiableCredential, KeyPair, etc.)
├── crypto-utils.ts          # RSA-2048 cryptographic operations with object signing
├── lock.ts                  # Lock class with key pair generation and ownership
├── device.ts               # Device class with ZKP verification and active lock checking
├── user.ts                 # User class with 1-VC-per-lock constraint enforcement
├── device-owner.ts         # DeviceOwner class with lock management and VC issuance
├── smart-contract.ts       # SmartContract singleton with ownership validation
├── index.ts               # Demo showcasing complete ZKP flow
└── __tests__/
    └── access-control.test.ts  # Comprehensive test suite with ZKP scenarios
```

## Security Features

### Implemented Security Measures

- **Zero-Knowledge Proof Architecture**: Devices verify without accessing original data
- **RSA-2048 Encryption**: Production-grade cryptographic signatures with PKCS1_PSS_PADDING
- **Owner-Only Operations**: Only lock owners can revoke their locks
- **Active Lock Validation**: Automatic checking prevents use of revoked credentials
- **1-VC-per-Lock Constraint**: Prevents credential duplication and management issues
- **Hash-Based Verification**: SHA-256 hashing ensures data integrity

## Development Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm run dev` - Run the demo with ts-node (development mode)
- `npm start` - Run the compiled JavaScript demo
- `npm test` - Run the comprehensive test suite
- `npm run clean` - Clean the dist directory

## Technical Specifications

### Cryptographic Implementation

- **Algorithm**: RSA-2048 with PKCS1_PSS_PADDING
- **Hashing**: SHA-256 for data integrity
- **Encoding**: Base64 for cross-platform compatibility
- **Key Generation**: Node.js crypto module with 2048-bit modulus

## Research Context

This project is part of a Final Thesis on decentralized access control systems, exploring the intersection of blockchain technology, zero-knowledge proofs, and IoT security. The implementation serves as a foundation.