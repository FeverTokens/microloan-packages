# SDK Imports Guide

## Overview

All necessary types and classes can be imported directly from `@fevertokens/sdk`. You **do not need** to import from `@fevertokens/core` (which is a private package).

## Available Imports

### Core Classes

```typescript
import {
  FeverDeployer,        // Main SDK class
  MemoryTracker,        // In-memory deployment tracker
  FileTracker,          // File-based deployment tracker
  PrivateKeyWallet,     // Private key wallet provider
  MnemonicWallet,       // Mnemonic/HD wallet provider
  SignerWallet,         // Ethers.js signer wrapper
  EnvironmentWallet,    // Environment variable wallet
} from '@fevertokens/sdk'
```

### TypeScript Types

```typescript
import type {
  DeploymentManifest,   // Manifest object type
  DeploymentResult,     // Deployment result type
  DeployOptions,        // Deployment options type
  DeployerConfig,       // Deployer configuration type
  ValidationResult,     // Validation result type
  ManifestKind,         // Manifest kind enum
  DeploymentRecord,     // Deployment record type
  WalletProvider,       // Wallet provider interface
  DeploymentTracker,    // Deployment tracker interface
} from '@fevertokens/sdk'
```

### All-in-One Import

```typescript
import {
  // Classes
  FeverDeployer,
  FileTracker,
  MemoryTracker,
  PrivateKeyWallet,
  MnemonicWallet,
  SignerWallet,
  EnvironmentWallet,

  // Types
  type DeploymentManifest,
  type DeploymentResult,
  type DeployOptions,
  type DeployerConfig,
  type ValidationResult,
  type ManifestKind,
  type DeploymentRecord,
  type WalletProvider,
  type DeploymentTracker,
} from '@fevertokens/sdk'
```

---

## Usage Examples

### Example 1: Basic Deployment

```typescript
import { FeverDeployer, FileTracker } from '@fevertokens/sdk'

const deployer = new FeverDeployer({
  wallet: {
    type: 'privateKey',
    value: process.env.PRIVATE_KEY!
  },
  network: {
    chainId: 1337,
    rpcUrl: 'http://localhost:8545'
  },
  tracker: new FileTracker('.fever/deployments')
})

const result = await deployer.deployFromFile('./manifest.yaml')
```

### Example 2: Programmatic Deployment with Types

```typescript
import {
  FeverDeployer,
  FileTracker,
  type DeploymentManifest,
  type DeploymentResult,
} from '@fevertokens/sdk'

const deployer = new FeverDeployer({
  wallet: { type: 'privateKey', value: privateKey },
  network: { chainId: 1337, rpcUrl: 'http://localhost:8545' },
  tracker: new FileTracker('.fever/deployments')
})

// Type-safe manifest
const manifest: DeploymentManifest = {
  apiVersion: 'beta/v1',
  kind: 'Contract',
  metadata: {
    name: 'my-token',
    version: '1.0.0'
  },
  spec: {
    contract: {
      name: 'StableCoin',
      constructorArgs: [
        { value: 'MyToken' },
        { value: 'MTK' },
        { value: 18 }
      ]
    }
  }
}

// Type-safe result
const result: DeploymentResult = await deployer.deploy(manifest)
console.log(`Deployed at: ${result.address}`)
```

### Example 3: Using Different Wallet Types

```typescript
import {
  FeverDeployer,
  PrivateKeyWallet,
  MnemonicWallet,
  SignerWallet,
  EnvironmentWallet,
} from '@fevertokens/sdk'
import { Wallet, JsonRpcProvider } from 'ethers'

// Option 1: Private Key Wallet (simplest)
const deployer1 = new FeverDeployer({
  wallet: {
    type: 'privateKey',
    value: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
  },
  network: { chainId: 1337, rpcUrl: 'http://localhost:8545' }
})

// Option 2: Mnemonic Wallet (HD wallet)
const deployer2 = new FeverDeployer({
  wallet: {
    type: 'mnemonic',
    value: 'test test test test test test test test test test test junk',
    path: "m/44'/60'/0'/0/0"  // Optional
  },
  network: { chainId: 1337, rpcUrl: 'http://localhost:8545' }
})

// Option 3: Ethers.js Signer
const provider = new JsonRpcProvider('http://localhost:8545')
const ethersWallet = new Wallet(privateKey, provider)

const deployer3 = new FeverDeployer({
  wallet: {
    type: 'signer',
    signer: ethersWallet
  },
  network: { chainId: 1337, rpcUrl: 'http://localhost:8545' }
})
```

### Example 4: Using Different Trackers

```typescript
import {
  FeverDeployer,
  FileTracker,
  MemoryTracker,
} from '@fevertokens/sdk'

// Option 1: File Tracker (persistent, recommended)
const deployer1 = new FeverDeployer({
  wallet: { type: 'privateKey', value: privateKey },
  network: { chainId: 1337, rpcUrl: 'http://localhost:8545' },
  tracker: new FileTracker('.fever/deployments')
})

// Option 2: Memory Tracker (temporary, for testing)
const deployer2 = new FeverDeployer({
  wallet: { type: 'privateKey', value: privateKey },
  network: { chainId: 1337, rpcUrl: 'http://localhost:8545' },
  tracker: new MemoryTracker()
})

// Option 3: No tracker (deployments won't be tracked)
const deployer3 = new FeverDeployer({
  wallet: { type: 'privateKey', value: privateKey },
  network: { chainId: 1337, rpcUrl: 'http://localhost:8545' }
  // No tracker specified
})
```

### Example 5: Type-Safe Configuration

```typescript
import {
  FeverDeployer,
  FileTracker,
  type DeployerConfig,
  type DeployOptions,
} from '@fevertokens/sdk'

// Type-safe deployer configuration
const config: DeployerConfig = {
  wallet: {
    type: 'privateKey',
    value: process.env.PRIVATE_KEY!
  },
  network: {
    chainId: 1337,
    rpcUrl: 'http://localhost:8545'
  },
  tracker: new FileTracker('.fever/deployments')
}

const deployer = new FeverDeployer(config)

// Type-safe deployment options
const options: DeployOptions = {
  skipConfirmation: true,
  forceRedeploy: false
}

const result = await deployer.deployFromFile('./manifest.yaml', options)
```

---

## Common Import Patterns

### Pattern 1: Minimal Import (File-based)

```typescript
import { FeverDeployer } from '@fevertokens/sdk'

const deployer = new FeverDeployer({
  wallet: { type: 'privateKey', value: privateKey },
  network: { chainId: 1337, rpcUrl: 'http://localhost:8545' }
})

await deployer.deployFromFile('./manifest.yaml')
```

### Pattern 2: Full TypeScript Support

```typescript
import {
  FeverDeployer,
  FileTracker,
  type DeploymentManifest,
  type DeploymentResult,
  type DeployOptions,
} from '@fevertokens/sdk'

const deployer = new FeverDeployer({
  wallet: { type: 'privateKey', value: privateKey },
  network: { chainId: 1337, rpcUrl: 'http://localhost:8545' },
  tracker: new FileTracker('.fever/deployments')
})

const manifest: DeploymentManifest = { ... }
const options: DeployOptions = { skipConfirmation: true }
const result: DeploymentResult = await deployer.deploy(manifest, options)
```

### Pattern 3: Batch Deployment

```typescript
import {
  FeverDeployer,
  type DeploymentManifest,
} from '@fevertokens/sdk'

const deployer = new FeverDeployer({ ... })

const manifests: DeploymentManifest[] = [
  { apiVersion: 'beta/v1', kind: 'Contract', ... },
  { apiVersion: 'beta/v1', kind: 'Contract', ... },
  { apiVersion: 'beta/v1', kind: 'Contract', ... },
]

for (const manifest of manifests) {
  await deployer.deploy(manifest)
}
```

---

## Migration from @fevertokens/core

If you have existing code importing from `@fevertokens/core`, update as follows:

### Before (❌ Old - Don't use)

```typescript
// DON'T DO THIS - @fevertokens/core is private!
import { FeverDeployer } from '@fevertokens/sdk'
import { DeploymentManifest } from '@fevertokens/core'  // ❌ Private package

const manifest: DeploymentManifest = { ... }
await deployer.deploy(manifest)
```

### After (✅ New - Correct)

```typescript
// DO THIS - Import everything from @fevertokens/sdk
import {
  FeverDeployer,
  type DeploymentManifest  // ✅ Public export
} from '@fevertokens/sdk'

const manifest: DeploymentManifest = { ... }
await deployer.deploy(manifest)
```

---

## Type Definitions

### DeploymentManifest

```typescript
interface DeploymentManifest {
  apiVersion: string        // e.g., 'beta/v1'
  kind: string             // 'Contract' | 'Package' | 'PackageSystem'
  metadata: {
    name: string
    version?: string
    description?: string
  }
  spec: {
    contract?: {
      name: string
      constructorArgs?: any[]
    }
    package?: {
      name: string
      constructorArgs?: any[]
    }
    system?: {
      name: string
      constructorArgs?: any[]
    }
    packages?: Array<{
      name: string
      address?: string
      functions?: string[] | '*'
      constructorArgs?: any[]
      initializer?: {
        function: string
        arguments: any[]
      }
    }>
    dependencies?: Record<string, {
      name: string
      address?: string
      constructorArgs?: any[]
    }>
  }
}
```

### DeploymentResult

```typescript
interface DeploymentResult {
  contractName: string      // Name of deployed contract
  address: string          // Deployed contract address
  transactionHash: string  // Deployment transaction hash
  deployer: string         // Deployer wallet address
  chainId: number          // Network chain ID
  blockNumber?: number     // Block number
  gasUsed?: string        // Gas used (in wei)
}
```

### DeployerConfig

```typescript
interface DeployerConfig {
  wallet: {
    type: 'privateKey' | 'mnemonic' | 'signer' | 'provider'
    value?: string           // For privateKey/mnemonic
    path?: string           // For mnemonic (HD path)
    signer?: Signer         // For signer type
    provider?: WalletProvider // For provider type
  }
  network: {
    chainId: number
    rpcUrl: string
  }
  tracker?: DeploymentTracker  // Optional deployment tracker
}
```

### DeployOptions

```typescript
interface DeployOptions {
  skipConfirmation?: boolean  // Skip user confirmation prompts
  forceRedeploy?: boolean     // Force redeployment if already exists
}
```

---

## Best Practices

1. **Always import from `@fevertokens/sdk`**
   ```typescript
   ✅ import { FeverDeployer, DeploymentManifest } from '@fevertokens/sdk'
   ❌ import { DeploymentManifest } from '@fevertokens/core'
   ```

2. **Use TypeScript for type safety**
   ```typescript
   import { type DeploymentManifest } from '@fevertokens/sdk'

   const manifest: DeploymentManifest = { ... }  // Type-safe!
   ```

3. **Import only what you need**
   ```typescript
   // Good - minimal imports
   import { FeverDeployer } from '@fevertokens/sdk'

   // Also good - explicit imports for clarity
   import {
     FeverDeployer,
     FileTracker,
     type DeploymentManifest
   } from '@fevertokens/sdk'
   ```

4. **Use `type` keyword for type-only imports** (TypeScript optimization)
   ```typescript
   import {
     FeverDeployer,              // Class (value)
     type DeploymentManifest,    // Type only
     type DeploymentResult,      // Type only
   } from '@fevertokens/sdk'
   ```

---

## See Also

- [API Reference](./API_REFERENCE.md) - Complete API documentation
- [Quick Start Guide](./QUICK_START.md) - Getting started
- [Examples](./README.md) - Usage examples
- [SDK Source](../../../fever-cli/packages/sdk/src/index.ts) - Export definitions
