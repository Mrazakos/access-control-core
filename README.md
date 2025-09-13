# Access Control Core

A TypeScript proof of concept for a decentralized Access Control System. This implementation demonstrates the core concepts of a blockchain-based access control system with verifiable credentials, smart locks, and device management.

## Architecture

The system consists of several key components based on the provided class diagram:

### Core Classes

- **User**: Manages verifiable credentials and can unlock locks
- **Device**: Represents smart lock devices that can verify credentials
- **Lock**: Represents a physical/digital lock with ownership and access control
- **DeviceOwner**: Can register locks and issue verifiable credentials
- **SmartContract**: Manages the global state of locks and ownership (singleton pattern)
- **CryptoUtils**: Utility functions for cryptographic operations

### Key Features

- **Verifiable Credentials (VCs)**: Digital certificates that grant access to specific locks
- **Lock Registration**: Device owners can register new locks in the system
- **Access Control**: Users can unlock devices using valid verifiable credentials
- **Revocation**: Device owners can revoke access to locks
- **Smart Contract Integration**: Simulated blockchain smart contract for decentralized management

## Installation

1. Install dependencies:
```bash
npm install
```

2. Build the project:
```bash
npm run build
```

## Usage

### Running the Demo

To see the system in action:

```bash
npm run dev
```

This will run the demo script that showcases:
- Creating a device owner and user
- Registering a new lock
- Issuing verifiable credentials
- Attempting to unlock devices
- Demonstrating revocation

### Running Tests

```bash
npm test
```

The test suite covers all major functionality including:
- Lock registration and management
- Verifiable credential issuance and verification
- User access control
- Smart contract operations
- Cryptographic utilities

## Example Usage

```typescript
import { DeviceOwner, User, Device, SmartContract } from './src/index';

// Create a device owner
const deviceOwner = new DeviceOwner();

// Generate keys and register a lock
const keyPair = deviceOwner.generateKeyPair();
const lock = deviceOwner.registerNewLock(keyPair.publicKey);

// Register with smart contract
const smartContract = SmartContract.getInstance();
smartContract.registerLock(keyPair.publicKey, lock.owner);

// Issue a verifiable credential to a user
const user = new User();
const vc = deviceOwner.issueVc(lock.lockId, 'user@example.com', 'Front Door');
user.storeVc(vc);
user.addLock(lock);

// Create a device and verify access
const device = new Device(lock.lockId, keyPair.publicKey);
const canAccess = device.verifyVc(vc);
const unlocked = user.unlock(lock.lockId);

console.log('Access granted:', canAccess && unlocked);
```

## Project Structure

```
src/
├── types.ts                 # Type definitions and interfaces
├── crypto-utils.ts          # Cryptographic utility functions
├── lock.ts                  # Lock class implementation
├── device.ts               # Device class implementation
├── user.ts                 # User class implementation
├── device-owner.ts         # DeviceOwner class implementation
├── smart-contract.ts       # SmartContract singleton implementation
├── index.ts               # Main exports and demo function
├── demo.ts                # Demo script runner
└── __tests__/
    └── access-control.test.ts  # Comprehensive test suite
```

## Security Considerations

This is a **proof of concept** implementation for educational purposes. In a production system, you would need:

- Real cryptographic implementations (not mock functions)
- Proper key management and storage
- Secure communication channels
- Blockchain integration for true decentralization
- Formal verification of smart contracts
- Comprehensive security audits

## Development Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm run dev` - Run the demo with ts-node
- `npm start` - Run the compiled JavaScript
- `npm test` - Run the test suite
- `npm run clean` - Clean the dist directory

## Future Enhancements

- Integration with actual blockchain networks (Ethereum, Hyperledger, etc.)
- Real cryptographic implementations with proper key management
- Web API for remote access
- Mobile app integration
- Advanced access control policies (time-based, location-based)
- Audit logging and monitoring
- Multi-signature support for high-security scenarios
