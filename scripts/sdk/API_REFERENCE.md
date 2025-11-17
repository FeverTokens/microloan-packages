# Fever SDK API Reference

## Core Methods

### `deploy(manifest, options?)`

Deploy contracts from a manifest object (no file needed).

**Parameters:**
- `manifest` (DeploymentManifest): Manifest object with deployment configuration
- `options?` (DeployOptions): Optional deployment options

**Returns:** `Promise<DeploymentResult>`

**Automatic Routing:**
The method automatically routes to the correct deployment method based on `manifest.kind`:
- `Contract` → `deployContract()` - Regular smart contracts
- `Package` → `deployPackage()` - POF package/facet contracts
- `PackageSystem` → `deployPackageSystem()` - Diamond proxy systems

**Example:**
```typescript
import { FeverDeployer, DeploymentManifest } from '@fevertokens/sdk'

const deployer = new FeverDeployer({
  wallet: { type: 'privateKey', value: privateKey },
  network: { chainId: 1337, rpcUrl: 'http://localhost:8545' }
})

// Create manifest object
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

// Deploy
const result = await deployer.deploy(manifest)
console.log(`Deployed at: ${result.address}`)
```

**Use Cases:**
- ✓ Programmatic manifest generation
- ✓ Batch deployments in loops
- ✓ Dynamic configuration at runtime
- ✓ CI/CD automation
- ✓ API-driven deployments
- ✓ Testing with generated manifests

---

### `deployFromFile(manifestPath, options?)`

Deploy contracts from a YAML or JSON manifest file.

**Parameters:**
- `manifestPath` (string): Path to manifest file (.yaml or .json)
- `options?` (DeployOptions): Optional deployment options

**Returns:** `Promise<DeploymentResult>`

**Example:**
```typescript
const result = await deployer.deployFromFile('./manifest.yaml', {
  skipConfirmation: true,
  forceRedeploy: false
})
```

**Use Cases:**
- ✓ Configuration files in version control
- ✓ Manual deployments with human-readable config
- ✓ Standard deployment workflows
- ✓ Documentation and examples

---

### `getAddress()`

Get the deployer wallet address.

**Returns:** `Promise<string>`

**Example:**
```typescript
const address = await deployer.getAddress()
console.log(`Deployer: ${address}`)
```

---

### `getChainId()`

Get the current network chain ID.

**Returns:** `Promise<number>`

**Example:**
```typescript
const chainId = await deployer.getChainId()
console.log(`Chain ID: ${chainId}`)
```

---

### `getDeployment(contractName, chainId?)`

Get deployment record for a specific contract.

**Parameters:**
- `contractName` (string): Name of the contract
- `chainId?` (number): Optional chain ID (defaults to configured network)

**Returns:** `Promise<DeploymentRecord | null>`

**Example:**
```typescript
const deployment = await deployer.getDeployment('StableCoin')
if (deployment) {
  console.log(`Found at: ${deployment.address}`)
}
```

---

### `listDeployments(chainId?)`

List all deployment records.

**Parameters:**
- `chainId?` (number): Optional chain ID filter

**Returns:** `Promise<DeploymentRecord[]>`

**Example:**
```typescript
const deployments = await deployer.listDeployments()
deployments.forEach(d => {
  console.log(`${d.contractName} at ${d.address}`)
})
```

---

### `getProvider()`

Get the ethers.js provider instance.

**Returns:** `Provider`

**Example:**
```typescript
const provider = deployer.getProvider()
const blockNumber = await provider.getBlockNumber()
```

---

### `getWallet()`

Get the wallet provider instance.

**Returns:** `WalletProvider`

**Example:**
```typescript
const wallet = deployer.getWallet()
const signer = await wallet.getSigner(provider)
```

---

### `getTracker()`

Get the deployment tracker instance.

**Returns:** `DeploymentTracker`

**Example:**
```typescript
const tracker = deployer.getTracker()
const deployments = await tracker.list(1337)
```

---

## Types

### `DeploymentManifest`

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
    contract?: ContractSpec
    package?: PackageSpec
    system?: SystemSpec
    packages?: PackageSpec[]
    dependencies?: Record<string, DependencySpec>
  }
}
```

### `DeploymentResult`

```typescript
interface DeploymentResult {
  contractName: string
  address: string
  transactionHash: string
  deployer: string
  chainId: number
  blockNumber?: number
  gasUsed?: string
}
```

### `DeployOptions`

```typescript
interface DeployOptions {
  skipConfirmation?: boolean  // Skip user confirmation
  forceRedeploy?: boolean     // Force redeployment
}
```

### `DeployerConfig`

```typescript
interface DeployerConfig {
  wallet: WalletConfig
  network: NetworkConfig
  tracker?: DeploymentTracker
}

interface WalletConfig {
  type: 'privateKey' | 'mnemonic' | 'signer' | 'provider'
  value?: string           // For privateKey/mnemonic
  path?: string           // For mnemonic (HD path)
  signer?: Signer         // For signer type
  provider?: WalletProvider // For provider type
}

interface NetworkConfig {
  chainId: number
  rpcUrl: string
}
```

---

## Comparison: `deploy()` vs `deployFromFile()`

| Feature | `deploy()` | `deployFromFile()` |
|---------|-----------|-------------------|
| **Input** | Manifest object | File path |
| **File I/O** | No | Yes |
| **Validation** | Basic | Full schema validation |
| **Performance** | Faster (in-memory) | Slower (file read) |
| **Use Case** | Programmatic | Configuration files |
| **Batch Deployment** | Excellent | Poor |
| **CI/CD** | Excellent | Good |
| **Testing** | Excellent | Good |
| **Debugging** | Easier | Harder |
| **Version Control** | Manual | Built-in |

---

## Example Workflows

### Workflow 1: Batch Deployment

```typescript
const tokens = [
  { name: 'USDT', symbol: 'USDT', decimals: 6 },
  { name: 'USDC', symbol: 'USDC', decimals: 6 },
  { name: 'DAI', symbol: 'DAI', decimals: 18 }
]

for (const token of tokens) {
  const manifest = {
    apiVersion: 'beta/v1',
    kind: 'Contract',
    metadata: { name: `${token.symbol}-token`, version: '1.0.0' },
    spec: {
      contract: {
        name: 'StableCoin',
        constructorArgs: [
          { value: token.name },
          { value: token.symbol },
          { value: token.decimals }
        ]
      }
    }
  }

  await deployer.deploy(manifest)
}
```

### Workflow 2: API-Driven Deployment

```typescript
// Fetch deployment config from API
const response = await fetch('https://api.example.com/deploy-config')
const manifest = await response.json()

// Deploy directly
const result = await deployer.deploy(manifest)

// Report back to API
await fetch('https://api.example.com/deployment-result', {
  method: 'POST',
  body: JSON.stringify(result)
})
```

### Workflow 3: Testing

```typescript
describe('Contract Deployment', () => {
  it('should deploy StableCoin', async () => {
    const manifest = {
      apiVersion: 'beta/v1',
      kind: 'Contract',
      metadata: { name: 'test-token', version: '1.0.0' },
      spec: {
        contract: {
          name: 'StableCoin',
          constructorArgs: [
            { value: 'Test' },
            { value: 'TST' },
            { value: 18 }
          ]
        }
      }
    }

    const result = await deployer.deploy(manifest)
    expect(result.address).toMatch(/^0x[a-fA-F0-9]{40}$/)
  })
})
```

---

## Error Handling

### Common Errors

**Invalid Manifest:**
```typescript
try {
  await deployer.deploy(manifest)
} catch (error) {
  if (error.message.includes('Invalid manifest')) {
    console.error('Manifest validation failed:', error.message)
  }
}
```

**Network Errors:**
```typescript
try {
  const chainId = await deployer.getChainId()
} catch (error) {
  console.error('Network connection failed:', error.message)
}
```

**Deployment Errors:**
```typescript
try {
  const result = await deployer.deploy(manifest)
} catch (error) {
  if (error.message.includes('revert')) {
    console.error('Transaction reverted:', error.message)
  }
}
```

---

## Best Practices

1. **Validate Manifests Before Deployment**
   ```typescript
   if (!manifest.kind || !manifest.spec) {
     throw new Error('Invalid manifest structure')
   }
   ```

2. **Use TypeScript for Type Safety**
   ```typescript
   import { DeploymentManifest } from '@fevertokens/core'

   const manifest: DeploymentManifest = { ... }
   ```

3. **Check Deployment History**
   ```typescript
   const existing = await deployer.getDeployment('MyContract')
   if (existing && !forceRedeploy) {
     console.log('Already deployed, skipping')
     return existing
   }
   ```

4. **Handle Errors Gracefully**
   ```typescript
   try {
     const result = await deployer.deploy(manifest)
   } catch (error) {
     console.error('Deployment failed:', error)
     // Retry logic, notifications, etc.
   }
   ```

5. **Track Deployments**
   ```typescript
   const result = await deployer.deploy(manifest)

   // Log to database
   await db.deployments.create({
     address: result.address,
     txHash: result.transactionHash,
     deployedAt: new Date()
   })
   ```

---

## Migration Guide

### From `deployFromFile()` to `deploy()`

**Before (File-based):**
```typescript
// manifest.yaml
const result = await deployer.deployFromFile('./manifest.yaml')
```

**After (Object-based):**
```typescript
// Load and parse yourself
const yaml = require('js-yaml')
const fs = require('fs')

const manifest = yaml.load(fs.readFileSync('./manifest.yaml', 'utf8'))
const result = await deployer.deploy(manifest)
```

**Or Generate Programmatically:**
```typescript
const manifest = {
  apiVersion: 'beta/v1',
  kind: 'Contract',
  metadata: { name: 'my-contract', version: '1.0.0' },
  spec: { contract: { name: 'MyContract', constructorArgs: [] } }
}

const result = await deployer.deploy(manifest)
```

---

## See Also

- [Quick Start Guide](./QUICK_START.md)
- [Full README](./README.md)
- [Programmatic Example](./deploy-programmatic.ts)
- [SDK Source Code](../../../fever-cli/packages/sdk/src/Deployer.ts)
