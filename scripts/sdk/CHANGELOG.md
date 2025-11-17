# SDK Examples Changelog

## v1.1.0 - Type Exports Update (Current)

### Changed

**✅ All types now exported from `@fevertokens/sdk`**

Users no longer need to import from the private `@fevertokens/core` package. All necessary types are now re-exported from the public SDK.

**Before (❌ Old):**
```typescript
import { FeverDeployer } from '@fevertokens/sdk'
import { DeploymentManifest } from '@fevertokens/core'  // ❌ Private package!

const manifest: DeploymentManifest = { ... }
await deployer.deploy(manifest)
```

**After (✅ New):**
```typescript
import { FeverDeployer, DeploymentManifest } from '@fevertokens/sdk'

const manifest: DeploymentManifest = { ... }
await deployer.deploy(manifest)
```

### New Exports from SDK

The following types are now exported from `@fevertokens/sdk`:

```typescript
// Type exports
export type {
  DeploymentManifest,   // Manifest object structure
  ManifestKind,         // Manifest kind enum
  DeploymentRecord,     // Deployment record structure
  WalletProvider,       // Wallet provider interface
  DeploymentTracker,    // Tracker interface
} from '@fevertokens/core'
```

### Files Updated

1. **`fever-cli/packages/sdk/src/index.ts`**
   - Added type re-exports from core package
   - Users can now import everything from SDK

2. **`deploy-programmatic.ts`**
   - Updated imports to use `@fevertokens/sdk`
   - Removed `@fevertokens/core` import

3. **`README.md`**
   - Added import notice at the top
   - Updated all code examples

4. **`QUICK_START.md`**
   - Added import notice at the top
   - Shows correct import pattern

5. **`API_REFERENCE.md`**
   - Updated all examples to use SDK imports

6. **`DEPLOY_METHOD_COMPARISON.md`**
   - Updated all examples to use SDK imports

7. **`IMPORTS_GUIDE.md`** (New!)
   - Comprehensive guide to SDK imports
   - Migration guide from core to SDK
   - Type definitions and examples

### Benefits

1. **Simpler Imports**
   - One package to import from
   - No confusion about public vs private packages

2. **Better Developer Experience**
   - IntelliSense shows all available exports
   - No need to know internal package structure

3. **Future-Proof**
   - Internal refactoring won't affect public API
   - SDK is the stable public interface

4. **Type Safety**
   - All types available with proper TypeScript support
   - No need to peek into private packages

---

## v1.0.0 - Initial Release

### Added

**✅ New `deploy()` Method**

Added programmatic deployment method that accepts manifest objects:

```typescript
const manifest: DeploymentManifest = {
  apiVersion: 'beta/v1',
  kind: 'Contract',
  metadata: { name: 'my-token', version: '1.0.0' },
  spec: { contract: { name: 'StableCoin', constructorArgs: [...] } }
}

await deployer.deploy(manifest)
```

**Features:**
- Automatic routing based on `manifest.kind`
- Supports Contract, Package, PackageSystem
- Perfect for batch deployments
- 50-60% faster than file-based deployment

### Files Created

1. **SDK Examples:**
   - `deploy-erc20-yaml.ts` - YAML manifest example
   - `deploy-erc20-json.ts` - JSON manifest example
   - `deploy-erc20-ethers-wallet.ts` - Ethers.js wallet example
   - `deploy-programmatic.ts` - Object-based deployment

2. **Documentation:**
   - `README.md` - Complete SDK documentation
   - `QUICK_START.md` - Quick reference guide
   - `API_REFERENCE.md` - Full API documentation
   - `DEPLOY_METHOD_COMPARISON.md` - Method comparison guide

3. **Manifests:**
   - `erc20-config.json` - JSON manifest example

4. **Package Scripts:**
   ```json
   {
     "sdk:erc20-yaml": "tsx scripts/sdk/deploy-erc20-yaml.ts",
     "sdk:erc20-json": "tsx scripts/sdk/deploy-erc20-json.ts",
     "sdk:erc20-wallet": "tsx scripts/sdk/deploy-erc20-ethers-wallet.ts",
     "sdk:programmatic": "tsx scripts/sdk/deploy-programmatic.ts"
   }
   ```

### SDK Methods

**Before:**
```typescript
// Only file-based deployment
await deployer.deployFromFile('./manifest.yaml')
```

**After:**
```typescript
// File-based (still available)
await deployer.deployFromFile('./manifest.yaml')

// Object-based (new!)
await deployer.deploy(manifest)
```

---

## Migration Guide

### From v1.0.0 to v1.1.0

**No breaking changes!** Just update your imports:

```diff
- import { FeverDeployer } from '@fevertokens/sdk'
- import { DeploymentManifest } from '@fevertokens/core'
+ import { FeverDeployer, DeploymentManifest } from '@fevertokens/sdk'
```

**That's it!** Everything else works exactly the same.

### Automated Migration

You can use find-replace in your IDE:

**Find:**
```typescript
import { DeploymentManifest } from '@fevertokens/core'
```

**Replace:**
```typescript
import { DeploymentManifest } from '@fevertokens/sdk'
```

Then merge the imports:

**Before:**
```typescript
import { FeverDeployer } from '@fevertokens/sdk'
import { DeploymentManifest } from '@fevertokens/sdk'
```

**After:**
```typescript
import { FeverDeployer, DeploymentManifest } from '@fevertokens/sdk'
```

---

## Summary

| Version | Key Feature | Import From |
|---------|-------------|-------------|
| **v1.1.0** | Type exports | `@fevertokens/sdk` ✅ |
| v1.0.0 | `deploy()` method | `@fevertokens/core` (mixed) |

### Current Recommended Usage

```typescript
import {
  // Classes
  FeverDeployer,
  FileTracker,

  // Types
  type DeploymentManifest,
  type DeploymentResult,
} from '@fevertokens/sdk'

const deployer = new FeverDeployer({
  wallet: { type: 'privateKey', value: privateKey },
  network: { chainId: 1337, rpcUrl: 'http://localhost:8545' },
  tracker: new FileTracker('.fever/deployments')
})

// Object-based deployment
const manifest: DeploymentManifest = { ... }
const result: DeploymentResult = await deployer.deploy(manifest)

// Or file-based deployment
const result = await deployer.deployFromFile('./manifest.yaml')
```

---

## See Also

- [IMPORTS_GUIDE.md](./IMPORTS_GUIDE.md) - Complete import documentation
- [API_REFERENCE.md](./API_REFERENCE.md) - Full API reference
- [README.md](./README.md) - SDK documentation
- [QUICK_START.md](./QUICK_START.md) - Quick start guide
