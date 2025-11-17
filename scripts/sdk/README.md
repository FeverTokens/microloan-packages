# Fever SDK Examples

This directory contains examples demonstrating different ways to use the Fever SDK for smart contract deployment.

> **📌 Important:** All imports should come from `@fevertokens/sdk` (not `@fevertokens/core`).
> See [IMPORTS_GUIDE.md](./IMPORTS_GUIDE.md) for complete import documentation.

```typescript
// ✅ Correct - Import from SDK
import { FeverDeployer, DeploymentManifest } from '@fevertokens/sdk'

// ❌ Wrong - Don't import from core (private package)
import { DeploymentManifest } from '@fevertokens/core'
```

## Examples Overview

### 1. Deploy ERC20 with YAML Manifest (`deploy-erc20-yaml.ts`)

**Method:** `deployFromFile()`

**What it demonstrates:**
- Using the SDK with YAML manifest files
- Deploying a simple Contract (kind: Contract)
- Environment variable substitution
- Deployment tracking with FileTracker

**Key Features:**
- ✓ YAML manifests are human-readable
- ✓ Easy to write and maintain
- ✓ Great for manual configuration
- ✓ Supports comments

**Run:**
```bash
npm run sdk:erc20-yaml
```

**Manifest:** `f9s/erc20-config.yaml`

---

### 2. Deploy ERC20 with JSON Manifest (`deploy-erc20-json.ts`)

**Method:** `deployFromFile()`

**What it demonstrates:**
- Using the SDK with JSON manifest files
- Identical deployment flow to YAML
- Programmatic manifest generation

**Key Features:**
- ✓ JSON is machine-readable
- ✓ Easy to generate programmatically
- ✓ Same validation as YAML
- ✓ Perfect for CI/CD pipelines

**Run:**
```bash
npm run sdk:erc20-json
```

**Manifest:** `f9s/erc20-config.json`

**Use Cases:**
- CI/CD pipelines generating manifests
- Programmatic deployment orchestration
- Integration with build systems
- Dynamic configuration from databases

---

### 3. Deploy ERC20 with Ethers.js Wallet (`deploy-erc20-ethers-wallet.ts`)

**Method:** `deployFromFile()`

**What it demonstrates:**
- Using ethers.js Wallet directly
- SignerWallet wrapper for custom signers
- Balance checking before/after deployment
- Integration with existing ethers.js code

**Key Features:**
- ✓ Full control over wallet configuration
- ✓ Works with any ethers.js Signer
- ✓ Access to ethers.js features (balance, nonce, etc.)
- ✓ Easy integration with existing projects

**Run:**
```bash
npm run sdk:erc20-wallet
```

**Manifest:** `f9s/erc20-config.yaml`

**When to use:**
- Already using ethers.js in your project
- Need custom wallet configuration
- Using hardware wallets or other signers
- Want to check balance before deployment

---

### 4. Programmatic Deployment (`deploy-programmatic.ts`)

**Method:** `deploy()` - NEW! 🎉

**What it demonstrates:**
- Using `deploy()` with manifest **objects** (no files!)
- Automatic routing based on `manifest.kind`
- Creating manifests programmatically in code
- Batch deployments in loops
- Dynamic manifest generation
- Perfect for CI/CD and automation

**Key Features:**
- ✓ No file I/O required - purely in-memory
- ✓ Automatic kind detection and routing
- ✓ Supports Contract, Package, PackageSystem
- ✓ Perfect for batch deployments
- ✓ Easy integration with APIs/databases
- ✓ Ideal for testing and automation

**Run:**
```bash
npm run sdk:programmatic
```

**Example Code:**
```typescript
import { FeverDeployer, DeploymentManifest } from '@fevertokens/sdk'

const deployer = new FeverDeployer({ ... })

// Create manifest object (no file needed!)
const manifest: DeploymentManifest = {
  apiVersion: 'beta/v1',
  kind: 'Contract',  // SDK auto-routes based on this!
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
```

**When to use:**
- Deploying from API responses
- Batch deployments in loops
- Dynamic configuration at runtime
- Testing with generated manifests
- CI/CD automation
- No manifest files needed

**Use Cases:**
```typescript
// Batch deployment
for (const config of tokenConfigs) {
  const manifest = { ... }  // Generate dynamically
  await deployer.deploy(manifest)
}

// API-driven deployment
const manifest = await fetch('/api/deploy-config').then(r => r.json())
await deployer.deploy(manifest)

// Testing
it('should deploy', async () => {
  const manifest = { ... }
  const result = await deployer.deploy(manifest)
  expect(result.address).toBeTruthy()
})
```

**See Also:** [API Reference](./API_REFERENCE.md) for complete `deploy()` documentation

---

## Prerequisites

1. **Environment Setup:**
   ```bash
   # Copy .env.example to .env
   cp .env.example .env

   # Configure your environment variables
   PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
   RPC_URL=http://localhost:8545
   CHAIN_ID=1337
   ADMIN_ADDRESS=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
   ```

2. **Local Blockchain:**
   ```bash
   # Start Anvil (from Foundry)
   anvil

   # Or use Hardhat node
   npx hardhat node
   ```

3. **Compile Contracts:**
   ```bash
   npm run compile
   ```

---

## SDK Wallet Types

The Fever SDK supports multiple wallet types:

### 1. **PrivateKeyWallet** (Simple)
```typescript
const deployer = new FeverDeployer({
  wallet: {
    type: 'privateKey',
    value: '0xac0974bec...'
  },
  network: { chainId: 1337, rpcUrl: 'http://localhost:8545' }
})
```
**Best for:** Quick testing, simple deployments

### 2. **MnemonicWallet** (HD Wallet)
```typescript
const deployer = new FeverDeployer({
  wallet: {
    type: 'mnemonic',
    value: 'test test test test test test test test test test test junk',
    path: "m/44'/60'/0'/0/0"  // Optional, defaults to first account
  },
  network: { chainId: 1337, rpcUrl: 'http://localhost:8545' }
})
```
**Best for:** Managing multiple accounts, production deployments

### 3. **SignerWallet** (Custom)
```typescript
import { Wallet, JsonRpcProvider } from 'ethers'

const provider = new JsonRpcProvider('http://localhost:8545')
const ethersWallet = new Wallet('0xac0974bec...', provider)

const deployer = new FeverDeployer({
  wallet: {
    type: 'signer',
    signer: ethersWallet
  },
  network: { chainId: 1337, rpcUrl: 'http://localhost:8545' }
})
```
**Best for:** Existing ethers.js integration, hardware wallets

### 4. **Provider Wallet** (Direct Provider)
```typescript
const deployer = new FeverDeployer({
  wallet: {
    type: 'provider',
    provider: myWalletProvider  // Must implement WalletProvider interface
  },
  network: { chainId: 1337, rpcUrl: 'http://localhost:8545' }
})
```
**Best for:** Custom wallet implementations

---

## Manifest Formats

Both YAML and JSON manifests are supported and work identically.

### YAML Example:
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
      - name: "name_"
        type: "string"
        value: "MyToken"

  deployer:
    wallet:
      type: privateKey
      value: "${PRIVATE_KEY}"
```

### JSON Example:
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
        {
          "name": "name_",
          "type": "string",
          "value": "MyToken"
        }
      ]
    },
    "deployer": {
      "wallet": {
        "type": "privateKey",
        "value": "${PRIVATE_KEY}"
      }
    }
  }
}
```

**Choose YAML when:**
- Writing manifests manually
- Need comments and documentation
- Human readability is priority

**Choose JSON when:**
- Generating manifests programmatically
- CI/CD automation
- Integration with other tools
- Strict validation requirements

---

## Deployment Tracking

All deployments are automatically tracked in `.fever/deployments/`:

```
.fever/deployments/
├── StableCoin_1337_1762596508436.json
├── SimpleStorage_1337_1762596508437.json
└── MicroLoanPackageSystem_1337_1762596508438.json
```

Each file contains:
- Contract name and address
- Transaction hash and deployer
- Constructor arguments
- Deployment timestamp
- Block number and gas used
- Metadata (ABI, bytecode)

---

## Advanced Usage

### Custom Deployment Options

```typescript
const result = await deployer.deployFromFile(manifestPath, {
  skipConfirmation: true,   // Skip user confirmation
  forceRedeploy: false      // Skip if already deployed
})
```

### Checking Deployment History

```typescript
// List all deployments for current chain
const deployments = await deployer.listDeployments()

// Get specific deployment
const deployment = await deployer.getDeployment('StableCoin')

// Get deployer address
const address = await deployer.getAddress()

// Get current chain ID
const chainId = await deployer.getChainId()
```

### Custom Tracker Location

```typescript
const deployer = new FeverDeployer({
  wallet: { type: 'privateKey', value: privateKey },
  network: { chainId: 1337, rpcUrl: 'http://localhost:8545' },
  tracker: new FileTracker('./custom/deployments/path')
})
```

---

## Troubleshooting

### Common Issues

1. **"PRIVATE_KEY not set"**
   - Make sure you have a `.env` file with `PRIVATE_KEY` set
   - Check that dotenv is loading correctly

2. **"Network connection failed"**
   - Ensure your local blockchain is running
   - Check RPC_URL in .env matches your node

3. **"Artifacts not found"**
   - Run `npm run compile` to compile contracts first
   - Check that `.fever/artifacts/` directory exists

4. **"Insufficient funds"**
   - Make sure your wallet has enough ETH for gas
   - For local networks, use a funded test account

---

## Next Steps

After mastering these examples, check out:

1. **Package Deployment** - Deploy individual packages
2. **PackageSystem Deployment** - Deploy complete Diamond systems
3. **Dependency Management** - Use dependencies between contracts
4. **Custom Networks** - Deploy to testnets and mainnet

See the main `scripts/deploy-with-sdk.ts` for a complete PackageSystem example.

---

## Resources

- **SDK Documentation:** `fever-cli/packages/sdk/README.md`
- **Manifest Schemas:** `fever-cli/packages/core/src/manifests/schemas/`
- **More Examples:** `microloan-packages/scripts/`

---

## Questions?

For issues or questions:
- Check the main README at `fever-cli/README.md`
- Open an issue at https://github.com/FeverTokens/fever-cli/issues
- Review the SDK source code at `fever-cli/packages/sdk/src/`
