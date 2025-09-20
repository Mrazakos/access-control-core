# Ac## Architecture

The system implements a zero-knowledge proof (ZKP) architecture where smart locks verify VC without ever seeing the original us├── types.ts           ### Implemented Security Measures

- **Zero-Knowledge Proof Architecture**: Smart locks verify without accessing original data
- **RSA-2048 Encryption**: Production-grade cryptographic signatures with PKCS1_PSS_PADDING
- **Owner-Only Operations**: Only lock owners can revoke VCs (locks cannot be revoked)
- **Active VC Validation**: Automatic checking prevents use of revoked VCs
- **1-VC-per-Lock Constraint**: Prevents VC duplication and management issues
- **Hash-Based Verification**: SHA-256 hashing ensures data integrityType definitions (VC, KeyPair, etc.)
├── crypto-utils.ts          # RSA-2048 cryptographic operations with object signing
├── lock.ts                  # Lock class with key pair generation and ownership
├── device.ts               # Device class (smart lock controller) with ZKP verification and active VC checking
├── user.ts                 # User class with 1-VC-per-lock constraint enforcement
├── device-owner.ts         # DeviceOwner class (lock owners) with VC management and VC issuance
├── smart-contract.ts       # SmartContract singleton with ownership validation
├── index.ts               # Demo showcasing complete ZKP flow
└── __tests__/
    └── access-control.test.ts  # Comprehensive test suite with ZKP scenariosnsuring maximum privacy and security.

### Core Flow

1. **Lock Owner** calls Smart Contract's `createLock()` → gets unique lockId
2. **Lock Owner** configures physical Smart Lock with lockId and public key
3. **Lock Owner** issues Verifiable Credentials (VCs) to authorized users (referred to as VCs after first mention)
4. **User** sends VC to Smart Lock for access
5. **Smart Lock** verifies VC using only data hashes (zero-knowledge verification)l Core

A TypeScript proof of concept for a decentralized Access Control System with Zero-Knowledge Proof verification. This implementation demonstrates the core concepts of a blockchain-based access control system with verifiable credentials (VC), smart locks, and secure lock management.

## Architecture

The system implements a zero-knowledge proof (ZKP) architecture where devices verify VC without ever seeing the original user data, ensuring maximum privacy and security.

### Core Flow

1. **Device Owner** calls Smart Contract's `createLock()` → gets unique lockId
2. **Device Owner** configures physical Device with lockId and public key
3. **Device Owner** issues Verifiable Credentials (VCs) to authorized users
4. **User** sends VC to Lock/Device for access
5. **Device** verifies VC using only data hashes (zero-knowledge verification)

### Core Classes

- **User**: Manages VCs with 1-VC-per-lock constraint
- **Device**: Smart lock controller that verifies VCs using ZKP principles
- **Lock**: Physical/digital locks with RSA key pairs and ownership tracking
- **DeviceOwner**: Lock owners who issue VCs and manage VC lifecycle
- **SmartContract**: Singleton managing global lock state and ownership validation
- **CryptoUtils**: RSA-2048 cryptographic operations with object signing support

### Key Features

- **Zero-Knowledge Proof Verification**: Smart locks verify VCs without accessing original user data
- **1-VC-per-Lock Constraint**: Each user can only have one active VC per lock
- **Owner-Only Revocation**: Only lock owners can revoke VCs (signatures). Locks themselves cannot be revoked.
- **Hash-Based Signatures**: VCs contain signed hashes of user metadata for privacy
- **Active Lock Validation**: Automatic checking of VC status during verification
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
- Lock owner registering a new lock via smart contract
- Physical smart lock configuration with lock credentials
- Issuing VCs with hash-based signatures
- Zero-knowledge proof verification (smart lock never sees original user data)
- VC revocation and security validation 

### Running Tests

```bash
npm test
```

The comprehensive test suite covers:
- Lock registration and management with proper ownership
- Zero-knowledge proof VC verification
- 1-VC-per-lock constraint enforcement
- Owner-only VC revocation security
- Active VC validation during verification
- RSA cryptographic operations

## Example Usage

```typescript
import { DeviceOwner, User, Device, SmartContract } from './src/index';

// Create a lock owner
const lockOwner = new DeviceOwner();

// Register a new lock through smart contract (gets unique lockId)
const lock = lockOwner.registerNewDevice("Front Door Lock");

// Issue a verifiable credential (VC) with zero-knowledge proof
const user = new User();
const vc = lockOwner.issueVc(lock.lockId, 'user@example.com', 'Front Door Access');

// User stores the VC (enforces 1-VC-per-lock)
user.storeVc(vc);

// Smart lock verifies using ZKP - only sees the hash, not original data
const smartLock = new Device(lock.lockId, lock.publicKey);
const isValidVC = smartLock.verifyVc(vc);

console.log('ZKP Verification Result:', isValidVC);

// Owner can revoke VC (only owner can revoke VCs)
lockOwner.revokeVc(vc);

// Verification now fails for revoked VC
const isStillValid = smartLock.verifyVc(vc);
console.log('After revocation:', isStillValid); // false
```

## Zero-Knowledge Proof Implementation

The system implements ZKP principles where:

1. **User metadata is hashed** before being signed
2. **Smart locks only receive the hash** in the VC
3. **Original user data never leaves the issuer** (Lock Owner)
4. **Verification uses only the hash** and signature validation
5. **Privacy is maintained** while ensuring security

### VC Structure

```typescript
interface VC {
  lockId: number;
  userMetaDataHash: string;  // SHA-256 hash of user data (ZKP)
  lockNickname: string;
  signature: string;         // RSA signature of the hash
}
```

## Project Structure

```
src/
├── types.ts                 # Type definitions (VC, KeyPair, etc.)
├── crypto-utils.ts          # RSA-2048 cryptographic operations with object signing
├── lock.ts                  # Lock class with key pair generation and ownership
├── device.ts               # Device class with ZKP verification and active VC checking
├── user.ts                 # User class with 1-VC-per-lock constraint enforcement
├── device-owner.ts         # DeviceOwner class with Device management and VC issuance
├── smart-contract.ts       # SmartContract singleton with ownership validation
├── index.ts               # Demo showcasing complete ZKP flow
└── __tests__/
  └── access-control.test.ts  # Comprehensive test suite with ZKP scenarios
```

## Security Features

### Implemented Security Measures

- **Zero-Knowledge Proof Architecture**: Devices verify without accessing original data
- **RSA-2048 Encryption**: Production-grade cryptographic signatures with PKCS1_PSS_PADDING
- **Owner-Only Operations**: Only device owners can revoke VCs
- **Active VC Validation**: Automatic checking prevents use of revoked VCs
- **1-VC-per-Lock Constraint**: Prevents VC duplication and management issues
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