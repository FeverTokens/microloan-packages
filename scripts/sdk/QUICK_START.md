# SDK Examples - Quick Start

> **📌 Important:** All imports come from `@fevertokens/sdk` (not `@fevertokens/core`).
>
> ```typescript
> // ✅ Correct
> import { FeverDeployer, DeploymentManifest } from '@fevertokens/sdk'
> ```

## Running the Examples

### Prerequisites

1. **Start local blockchain:**
   ```bash
   anvil
   ```

2. **Ensure contracts are compiled:**
   ```bash
   npm run compile
   ```

3. **Verify .env file exists with:**
   ```
   PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
   RPC_URL=http://localhost:8545
   CHAIN_ID=1337
   ADMIN_ADDRESS=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
   ```

---

## Example 1: YAML Manifest

**Deploy ERC20 token using YAML manifest**

```bash
npm run sdk:erc20-yaml
```

**What it demonstrates:**
- ✓ YAML manifest loading
- ✓ Environment variable substitution (`${PRIVATE_KEY}`)
- ✓ Contract deployment with constructor args
- ✓ Automatic deployment tracking

**Files:**
- Script: `scripts/sdk/deploy-erc20-yaml.ts`
- Manifest: `f9s/erc20-config.yaml`

---

## Example 2: JSON Manifest

**Deploy ERC20 token using JSON manifest**

```bash
npm run sdk:erc20-json
```

**What it demonstrates:**
- ✓ JSON manifest loading (works identically to YAML)
- ✓ Same deployment flow, different format
- ✓ Programmatic manifest generation friendly

**Files:**
- Script: `scripts/sdk/deploy-erc20-json.ts`
- Manifest: `f9s/erc20-config.json`

**When to use JSON:**
- CI/CD pipelines
- Programmatic generation
- Build system integration
- No comments needed

---

## Example 3: Ethers.js Wallet

**Deploy using ethers.js Wallet directly**

```bash
npm run sdk:erc20-wallet
```

**What it demonstrates:**
- ✓ Custom ethers.js Wallet integration
- ✓ SignerWallet wrapper usage
- ✓ Balance checking before/after deployment
- ✓ Full control over wallet configuration

**Files:**
- Script: `scripts/sdk/deploy-erc20-ethers-wallet.ts`
- Manifest: `f9s/erc20-config.yaml`

**When to use SignerWallet:**
- Existing ethers.js projects
- Hardware wallet integration
- Custom signing logic
- Need wallet features (balance, nonce, etc.)

---

## Example 4: Programmatic Deployment (NEW! 🎉)

**Deploy using manifest objects (no files!)**

```bash
npm run sdk:programmatic
```

**What it demonstrates:**
- ✓ `deploy()` method with manifest objects
- ✓ Automatic kind-based routing
- ✓ Batch deployments in loops
- ✓ Dynamic manifest generation
- ✓ No file I/O required

**Files:**
- Script: `scripts/sdk/deploy-programmatic.ts`
- Manifest: **Generated in code!**

**When to use `deploy()`:**
- Batch deployments
- API-driven deployments
- CI/CD automation
- Testing scenarios
- Dynamic configuration

**Example:**
```typescript
const manifest = {
  apiVersion: 'beta/v1',
  kind: 'Contract',  // Auto-routes!
  metadata: { name: 'my-token', version: '1.0.0' },
  spec: { contract: { name: 'StableCoin', constructorArgs: [...] } }
}

await deployer.deploy(manifest)
```

---

## All SDK Deployment Scripts

```bash
# SDK Examples (Contract kind)
npm run sdk:erc20-yaml        # Example 1: YAML manifest (deployFromFile)
npm run sdk:erc20-json        # Example 2: JSON manifest (deployFromFile)
npm run sdk:erc20-wallet      # Example 3: Ethers.js wallet (deployFromFile)
npm run sdk:programmatic      # Example 4: Manifest objects (deploy) NEW!

# Production Deployments
npm run deploy:sdk            # PackageSystem deployment
npm run deploy:simple         # SimpleStorage deployment
npm run deploy:stablecoin     # Hardhat deployment (for comparison)
```

---

## Expected Output

All examples should output:

```
╔═══════════════════════════════════════════════════╗
║   ✅ Deployment Successful!                      ║
╚═══════════════════════════════════════════════════╝

📦 Deployment Details:
   Contract: StableCoin
   Address: 0x...
   Transaction: 0x...
   Deployer: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
   Chain ID: 1337
   Block: XX
   Gas Used: 659426
```

---

## Troubleshooting

### "PRIVATE_KEY not set"
```bash
# Check .env file exists
ls -la .env

# If not, copy from example
cp .env.example .env
```

### "Network connection failed"
```bash
# Make sure Anvil is running
anvil

# Or check if another node is running on port 8545
lsof -i :8545
```

### "Artifacts not found"
```bash
# Compile contracts first
npm run compile

# Verify artifacts exist
ls -la .fever/artifacts/StableCoin/
```

### "Insufficient funds"
Use Anvil's default test account (already funded):
```
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

---

## Next Steps

1. ✅ **Master Contract deployment** (these examples)
2. 📦 **Learn Package deployment** - See `deploy-simple-storage.ts`
3. 💎 **Explore PackageSystem** - See `deploy-with-sdk.ts`
4. 🚀 **Deploy to testnet** - Update RPC_URL and CHAIN_ID

---

## SDK Comparison

| Feature | YAML Example | JSON Example | Wallet Example |
|---------|-------------|-------------|----------------|
| **Manifest Format** | YAML | JSON | YAML |
| **Wallet Type** | PrivateKey | PrivateKey | Ethers Wallet |
| **Balance Check** | ❌ | ❌ | ✅ |
| **Gas Tracking** | Basic | Basic | Detailed |
| **Use Case** | Manual config | Automation | Integration |

---

## Learn More

- **Full README:** `scripts/sdk/README.md`
- **SDK Documentation:** `fever-cli/packages/sdk/README.md`
- **Manifest Schemas:** `fever-cli/packages/core/src/manifests/schemas/`
- **More Examples:** `microloan-packages/scripts/`

---

## Code Snippets

### Basic SDK Usage (PrivateKey)
```typescript
import { FeverDeployer, FileTracker } from '@fevertokens/sdk'

const deployer = new FeverDeployer({
  wallet: {
    type: 'privateKey',
    value: process.env.PRIVATE_KEY
  },
  network: {
    chainId: 1337,
    rpcUrl: 'http://localhost:8545'
  },
  tracker: new FileTracker('.fever/deployments')
})

const result = await deployer.deployFromFile('manifest.yaml')
```

### Using Ethers.js Wallet
```typescript
import { FeverDeployer, SignerWallet } from '@fevertokens/sdk'
import { Wallet, JsonRpcProvider } from 'ethers'

const provider = new JsonRpcProvider('http://localhost:8545')
const wallet = new Wallet(privateKey, provider)

const deployer = new FeverDeployer({
  wallet: {
    type: 'signer',
    signer: wallet
  },
  network: {
    chainId: 1337,
    rpcUrl: 'http://localhost:8545'
  }
})
```

### Check Deployment History
```typescript
// List all deployments
const deployments = await deployer.listDeployments()

// Get specific deployment
const deployment = await deployer.getDeployment('StableCoin')

// Check deployer address
const address = await deployer.getAddress()
```

---

**Happy Deploying! 🚀**
