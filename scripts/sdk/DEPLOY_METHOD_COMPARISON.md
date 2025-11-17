# SDK Deployment Methods Comparison

## Overview

The Fever SDK provides two methods for deploying smart contracts:

1. **`deployFromFile()`** - File-based deployment (YAML/JSON)
2. **`deploy()`** - Object-based deployment (Programmatic)

## Quick Comparison

| Feature | `deployFromFile()` | `deploy()` |
|---------|-------------------|-----------|
| **Input** | File path (string) | Manifest object |
| **File I/O** | Required | None |
| **Validation** | Full schema validation | Basic object validation |
| **Performance** | Slower (file read + parse) | Faster (in-memory) |
| **Best For** | Configuration files | Programmatic automation |
| **Version Control** | Easy (commit manifest files) | Manual (commit code) |
| **Batch Deployment** | Poor (one file per deploy) | Excellent (loop through configs) |
| **CI/CD** | Good | Excellent |
| **Testing** | Good | Excellent |
| **Debugging** | Harder (external files) | Easier (inline code) |
| **Learning Curve** | Low | Medium |

---

## Method 1: `deployFromFile(manifestPath, options?)`

### Description
Deploy contracts from YAML or JSON manifest files.

### When to Use
- ✓ Manual deployments with human-readable configuration
- ✓ Configuration files in version control
- ✓ Standard deployment workflows
- ✓ Documentation and examples
- ✓ Learning the SDK (easier to start)

### Pros
- Human-readable configuration
- Easy version control
- Supports comments (YAML)
- Clear separation of config and code
- Full schema validation

### Cons
- Requires file I/O
- Slower performance
- Not ideal for batch deployments
- Harder to generate dynamically

### Example Usage

**YAML Manifest (`manifest.yaml`):**
```yaml
apiVersion: beta/v1
kind: Contract

metadata:
  name: my-token
  version: 1.0.0

spec:
  contract:
    name: StableCoin
    constructorArgs:
      - value: "MyToken"
      - value: "MTK"
      - value: 18
```

**Deployment Code:**
```typescript
import { FeverDeployer, FileTracker } from '@fevertokens/sdk'

const deployer = new FeverDeployer({
  wallet: { type: 'privateKey', value: privateKey },
  network: { chainId: 1337, rpcUrl: 'http://localhost:8545' },
  tracker: new FileTracker('.fever/deployments')
})

// Deploy from YAML file
const result = await deployer.deployFromFile('./manifest.yaml')
console.log(`Deployed at: ${result.address}`)
```

**JSON Manifest (`manifest.json`):**
```json
{
  "apiVersion": "beta/v1",
  "kind": "Contract",
  "metadata": {
    "name": "my-token",
    "version": "1.0.0"
  },
  "spec": {
    "contract": {
      "name": "StableCoin",
      "constructorArgs": [
        { "value": "MyToken" },
        { "value": "MTK" },
        { "value": 18 }
      ]
    }
  }
}
```

**Deployment Code:**
```typescript
// Deploy from JSON file (same API)
const result = await deployer.deployFromFile('./manifest.json')
```

---

## Method 2: `deploy(manifest, options?)`

### Description
Deploy contracts from manifest objects created in code.

### When to Use
- ✓ Programmatic deployment automation
- ✓ Batch deployments in loops
- ✓ API-driven deployments
- ✓ CI/CD pipelines
- ✓ Testing scenarios
- ✓ Dynamic configuration at runtime

### Pros
- No file I/O required
- Faster performance
- Perfect for batch deployments
- Easy to generate dynamically
- Great for testing
- Excellent for automation

### Cons
- Requires TypeScript knowledge
- No file-based version control
- Manual validation needed
- More code to write

### Example Usage

**Single Deployment:**
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

// Deploy directly from object
const result = await deployer.deploy(manifest)
console.log(`Deployed at: ${result.address}`)
```

**Batch Deployment:**
```typescript
// Deploy multiple tokens in a loop
const tokens = [
  { name: 'USDT', symbol: 'USDT', decimals: 6 },
  { name: 'USDC', symbol: 'USDC', decimals: 6 },
  { name: 'DAI', symbol: 'DAI', decimals: 18 }
]

for (const token of tokens) {
  const manifest: DeploymentManifest = {
    apiVersion: 'beta/v1',
    kind: 'Contract',
    metadata: {
      name: `${token.symbol.toLowerCase()}-token`,
      version: '1.0.0'
    },
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

  const result = await deployer.deploy(manifest)
  console.log(`${token.symbol} deployed at: ${result.address}`)
}
```

**API-Driven Deployment:**
```typescript
// Fetch deployment config from API
const response = await fetch('https://api.example.com/deploy-config')
const manifest = await response.json()

// Deploy directly
const result = await deployer.deploy(manifest)

// Report back to API
await fetch('https://api.example.com/deployment-result', {
  method: 'POST',
  body: JSON.stringify({
    address: result.address,
    txHash: result.transactionHash
  })
})
```

**Testing:**
```typescript
describe('Token Deployment', () => {
  it('should deploy StableCoin', async () => {
    const manifest: DeploymentManifest = {
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
    expect(result.contractName).toBe('StableCoin')
  })
})
```

---

## Automatic Kind-Based Routing

Both methods automatically route to the correct deployment function based on `manifest.kind`:

```typescript
// manifest.kind = 'Contract'
// → Calls deployContract() internally

// manifest.kind = 'Package'
// → Calls deployPackage() internally

// manifest.kind = 'PackageSystem'
// → Calls deployPackageSystem() internally
```

**Example with Different Kinds:**

```typescript
// Contract deployment
const contractManifest = {
  kind: 'Contract',
  // ... contract spec
}
await deployer.deploy(contractManifest)  // Routes to deployContract()

// Package deployment
const packageManifest = {
  kind: 'Package',
  // ... package spec
}
await deployer.deploy(packageManifest)  // Routes to deployPackage()

// PackageSystem deployment
const systemManifest = {
  kind: 'PackageSystem',
  // ... system spec with packages
}
await deployer.deploy(systemManifest)  // Routes to deployPackageSystem()
```

---

## Use Case Recommendations

### Use `deployFromFile()` when:
1. **Manual Deployments**
   - Deploying to production/testnet manually
   - One-off contract deployments
   - Learning and experimentation

2. **Configuration Management**
   - Want manifest files in git
   - Need human-readable configs
   - Want to add comments (YAML)

3. **Documentation**
   - Creating examples
   - Writing tutorials
   - Sharing deployment configs

4. **Simple Workflows**
   - Single contract deployments
   - Standard deployment process
   - No automation needed

### Use `deploy()` when:
1. **Automation**
   - CI/CD pipelines
   - Automated testing
   - Deployment scripts

2. **Batch Operations**
   - Deploying multiple contracts
   - Multi-chain deployments
   - Token factory patterns

3. **Dynamic Generation**
   - API-driven deployments
   - Database-driven configs
   - Runtime parameter injection

4. **Integration**
   - Existing TypeScript projects
   - Backend services
   - Deployment orchestration platforms

5. **Testing**
   - Unit tests
   - Integration tests
   - End-to-end tests

---

## Performance Comparison

**Scenario: Deploy 10 tokens**

### Using `deployFromFile()`:
```typescript
// Need 10 separate files
// manifest-usdt.yaml
// manifest-usdc.yaml
// ... etc

for (const file of manifestFiles) {
  await deployer.deployFromFile(file)
}

// Performance: ~2-5s (file I/O + parsing overhead)
```

### Using `deploy()`:
```typescript
// Generate manifests in loop
for (const config of tokenConfigs) {
  const manifest = { ... }  // Create in memory
  await deployer.deploy(manifest)
}

// Performance: ~1-2s (no file I/O)
// ~50-60% faster!
```

---

## Migration Guide

### From `deployFromFile()` to `deploy()`

**Before:**
```typescript
// manifest.yaml required
const result = await deployer.deployFromFile('./manifest.yaml')
```

**After:**
```typescript
// Load manifest yourself (if needed)
import fs from 'fs'
import yaml from 'js-yaml'

const manifest = yaml.load(fs.readFileSync('./manifest.yaml', 'utf8'))
const result = await deployer.deploy(manifest)
```

**Or generate directly:**
```typescript
// No file needed!
const manifest = {
  apiVersion: 'beta/v1',
  kind: 'Contract',
  metadata: { name: 'my-contract', version: '1.0.0' },
  spec: { contract: { name: 'MyContract', constructorArgs: [] } }
}

const result = await deployer.deploy(manifest)
```

---

## Best Practices

### For `deployFromFile()`
1. Keep manifests in version control
2. Use YAML for human readability
3. Add comments to explain configuration
4. Validate manifests before committing
5. Separate manifests per environment (dev/prod)

### For `deploy()`
1. Use TypeScript for type safety
2. Validate manifests programmatically
3. Extract manifest generation to helper functions
4. Add error handling for dynamic generation
5. Log generated manifests for debugging

---

## Summary

| Scenario | Recommended Method | Why |
|----------|-------------------|-----|
| **Learning SDK** | `deployFromFile()` | Easier to start, clearer structure |
| **Production Deployment** | `deployFromFile()` | Version control, audit trail |
| **CI/CD Pipeline** | `deploy()` | Automation, no file management |
| **Batch Deployment** | `deploy()` | Performance, easier to loop |
| **API Integration** | `deploy()` | Dynamic, no file I/O |
| **Testing** | `deploy()` | Faster, easier to generate |
| **Documentation** | `deployFromFile()` | Clearer examples, easy to share |
| **Multi-Chain** | `deploy()` | Easier parameter injection |

---

## Resources

- **Examples:**
  - `deploy-erc20-yaml.ts` - Using `deployFromFile()` with YAML
  - `deploy-erc20-json.ts` - Using `deployFromFile()` with JSON
  - `deploy-programmatic.ts` - Using `deploy()` with objects

- **Documentation:**
  - [API Reference](./API_REFERENCE.md) - Complete API docs
  - [Quick Start](./QUICK_START.md) - Getting started guide
  - [README](./README.md) - Full SDK documentation

- **Run Examples:**
  ```bash
  npm run sdk:erc20-yaml        # deployFromFile() + YAML
  npm run sdk:erc20-json        # deployFromFile() + JSON
  npm run sdk:programmatic      # deploy() + objects
  ```
