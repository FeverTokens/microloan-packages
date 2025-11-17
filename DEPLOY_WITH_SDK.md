# Deploy with SDK Guide

This guide explains how to use the updated `deploy-with-sdk.ts` script with the new artifact resolution system.

## Overview

The `deploy-with-sdk.ts` script has been enhanced to use the optimized `@fevertokens/sdk` artifact resolution system, which supports:

- **Combined.json** - Modern consolidated artifact format (primary)
- **Legacy .fever/** - Traditional directory-based artifacts (fallback)
- **Automatic Detection** - Intelligently finds and uses available artifacts
- **Contract Introspection** - Lists all available contracts before deployment
- **Better Diagnostics** - Helpful error messages and troubleshooting guidance

## Prerequisites

### Environment Setup

1. **Copy environment file**:
   ```bash
   cp .env.example .env
   ```

2. **Configure `.env`**:
   ```bash
   PRIVATE_KEY=0x...your private key...
   RPC_URL=http://localhost:8545      # or your RPC endpoint
   CHAIN_ID=1337                       # or your chain ID
   ADMIN_ADDRESS=0x...your admin address...
   ```

### Compile Contracts

Before running deployment, compile all contracts to generate artifacts:

```bash
npm run compile:all
```

This generates the `combined.json` file at `.fever/combined.json`.

## Running the Script

### Using npm script

```bash
npm run deploy:sdk
```

### Using ts-node directly

```bash
ts-node scripts/deploy-with-sdk.ts
```

## How It Works

### 1. Initialization

The script initializes the FeverDeployer with artifact resolver:

```typescript
const deployer = new FeverDeployer({
  wallet: {
    type: 'privateKey',
    value: privateKey
  },
  network: { chainId, rpcUrl },
  tracker: new FileTracker('.fever/deployments'),
  artifacts: {
    combinedPath: './.fever/combined.json',  // Modern format
    legacyBasePath: './.fever',              // Legacy fallback
    fallbackToLegacy: true                   // Use fallback if needed
  }
})
```

### 2. Artifact Detection

The script automatically detects available artifacts:

```
📦 Found combined.json artifact file
✅ Found 12 contracts in artifacts
   • LoanRegistry
   • LoanFunding
   • LoanRepayment
   • ... and 9 more
```

### 3. Contract Introspection

Available contracts are listed for verification:

```
📦 Artifact Resolution Summary:
   Total contracts: 12
   Combined.json: ✅ Available
   Resolver caching: ✅ Enabled
```

### 4. Deployment

The script attempts to deploy from the manifest file:

```
🚀 Attempting deployment from manifest...
✅ Deployment successful!
📦 Deployment details:
   Contract: LendingApplication
   Address: 0x...
   Transaction: 0x...
```

## Output Examples

### Successful Run

```
╔═══════════════════════════════════════════════════╗
║   MicroLoan PackageSystem Deployment (SDK)       ║
╚═══════════════════════════════════════════════════╝

📋 Configuration:
   RPC URL: http://localhost:8545
   Chain ID: 1337
   Admin: 0x...

⚙️  Initializing Fever SDK deployer...
📦 Found combined.json artifact file

✅ Found 12 contracts in artifacts
   • LoanRegistry
   • LoanFunding
   • LoanRepayment
   • MicroLoanTerms
   • ... and 8 more

✅ Deployer initialized
   Address: 0x...

📄 Loading manifest...
   Path: .../f9s/microloan-package-system.yaml

🔌 Verifying network connectivity...
✅ Network connected
   Chain ID: 1337

🚀 Attempting deployment from manifest...
✅ Deployment successful!
📦 Deployment details:
   Contract: LendingApplication
   Address: 0x...
   Transaction: 0x...

📦 Artifact Resolution Summary:
   Total contracts: 12
   Combined.json: ✅ Available
   Resolver caching: ✅ Enabled

📚 Checking deployment history...
   Found 1 deployment(s)
   1. LendingApplication at 0x...

╔═══════════════════════════════════════════════════╗
║   SDK Deployment Test Complete!                  ║
╚═══════════════════════════════════════════════════╝
```

### Missing combined.json

```
⚙️  Initializing Fever SDK deployer...
⚠️  combined.json not found, will use legacy .fever/ format
   Expected path: .../microloan-packages/.fever/combined.json

✅ Found 12 contracts in artifacts (from .fever/)
```

### Contract Not Found Error

```
❌ Contract not found in artifacts

📋 Available contracts:
   • LoanRegistry
   • LoanFunding
   • LoanRepayment
   • ... (9 more)

💡 Troubleshooting:
   1. Check combined.json exists: .../microloan-packages/.fever/combined.json
   2. Run: npm run compile:all
   3. Verify contract names in manifest match available contracts
```

## Key Features

### 1. Automatic Artifact Detection

The script automatically detects and uses:
- ✅ `combined.json` if available (modern format)
- ✅ `.fever/` directory if `combined.json` not found (legacy format)
- ✅ Both formats simultaneously with graceful fallback

### 2. Contract Introspection

Before deployment, the script:
- Lists all available contracts
- Shows contract count
- Provides clear feedback if artifacts are missing

### 3. Smart Error Handling

When errors occur:
- Shows available contracts for debugging
- Provides specific troubleshooting steps
- Suggests compilation if artifacts missing
- Helps verify manifest vs. available contracts

### 4. Deployment Tracking

The script:
- Uses `FileTracker` to record deployments
- Shows deployment history
- Tracks contract addresses and transactions

## Configuration Options

### Artifact Resolution

The script supports these artifact resolution configurations:

```typescript
artifacts: {
  combinedPath: './.fever/combined.json',  // Path to combined.json
  legacyBasePath: './.fever',              // Legacy .fever/ directory
  fallbackToLegacy: true                   // Fall back to legacy if needed
}
```

### Custom Paths

To use custom artifact paths:

1. Edit `scripts/deploy-with-sdk.ts`
2. Modify the `combinedJsonPath` variable:

```typescript
const combinedJsonPath = resolve(__dirname, '../custom/path/combined.json')
```

## Workflow

### Development Workflow

1. **Edit contracts**
   ```bash
   # Modify Solidity contracts
   ```

2. **Compile contracts**
   ```bash
   npm run compile:all
   ```

3. **Run deployment**
   ```bash
   npm run deploy:sdk
   ```

4. **Check results**
   ```bash
   cat .fever/deployments/deployments.json
   ```

### CI/CD Integration

```yaml
# Example GitHub Actions
- name: Compile contracts
  run: npm run compile:all

- name: Deploy with SDK
  run: npm run deploy:sdk
  env:
    PRIVATE_KEY: ${{ secrets.PRIVATE_KEY }}
    RPC_URL: ${{ secrets.RPC_URL }}
    CHAIN_ID: ${{ secrets.CHAIN_ID }}
    ADMIN_ADDRESS: ${{ secrets.ADMIN_ADDRESS }}
```

## Troubleshooting

### Problem: "combined.json not found"

**Solution**:
```bash
npm run compile:all
ls .fever/combined.json
```

### Problem: "Contract not found"

**Solution**:
1. Check contract name in manifest matches available contracts
2. Run `npm run compile:all` to regenerate artifacts
3. Check `.env` ADMIN_ADDRESS is valid

### Problem: "Network connection failed"

**Solution**:
1. Verify RPC_URL in `.env`
2. Check network is running: `npm run node`
3. Verify CHAIN_ID matches network

### Problem: "Insufficient funds"

**Solution**:
1. Fund the deployer account
2. Check balance: `ethers.provider.getBalance(deployerAddress)`
3. Use funded test account

### Problem: "Wallet validation failed"

**Solution**:
1. Verify PRIVATE_KEY format (with 0x prefix)
2. Check PRIVATE_KEY is valid Ethereum private key
3. Ensure .env file is properly formatted

## Environment Variables

Required:
- `PRIVATE_KEY` - Deployer private key (0x...)
- `ADMIN_ADDRESS` - Admin account address (0x...)

Optional:
- `RPC_URL` - RPC endpoint (default: http://localhost:8545)
- `CHAIN_ID` - Chain ID (default: 1337)

## Next Steps

### After Successful Deployment

1. **Verify on Block Explorer**
   - Navigate to `https://explorer.example.com/address/{address}`
   - Confirm contract code is deployed

2. **Interact with Contract**
   - Use ethers.js to call contract functions
   - Test contract functionality

3. **Update Manifest**
   - Add deployed addresses to manifest
   - Store for future reference

### Performance Optimization

The artifact resolver provides caching:
- First contract: Full disk I/O + parsing
- Subsequent contracts: <1ms (memory cache)

For large projects with many contracts, this results in 70-90% faster multi-contract resolution.

## Advanced Usage

### Using ArtifactResolver Directly

For advanced use cases, access the resolver directly:

```typescript
const resolver = deployer.getArtifactResolver()
const availableContracts = resolver.getAvailableContracts()

// Get specific artifact
const artifact = await resolver.resolveContract('LoanRegistry')
console.log('Selectors:', artifact.selectors)
console.log('Events:', artifact.events)
```

### Dynamic Artifact Paths

Switch artifact sources at runtime:

```typescript
deployer.setCombinedJsonPath('./custom/path/combined.json')
const result = await deployer.deploy(manifest)
```

### Artifact Caching Control

Clear cache when switching sources:

```typescript
const resolver = deployer.getArtifactResolver()
resolver.clearCache()
```

## Related Documentation

- [Artifact Resolution Guide](../fever-cli/packages/sdk/ARTIFACT_RESOLUTION.md)
- [Fever Deployer Examples](../fever-cli/packages/sdk/EXAMPLES.md)
- [Architecture Details](../fever-cli/packages/sdk/ARCHITECTURE.md)

## Support

For issues or questions:

1. Check this guide's troubleshooting section
2. Review SDK documentation
3. Check artifact file exists: `.fever/combined.json`
4. Verify environment variables are set
5. Check deployment logs in `.fever/deployments/`

## Summary

The updated `deploy-with-sdk.ts` script provides:

✅ **Modern Artifact Resolution** - Uses combined.json with legacy fallback
✅ **Contract Introspection** - Lists available contracts automatically
✅ **Smart Diagnostics** - Helpful error messages and troubleshooting
✅ **Performance** - In-memory caching for fast resolution
✅ **Reliability** - Robust error handling and validation

Ready to deploy your MicroLoan PackageSystem! 🚀
