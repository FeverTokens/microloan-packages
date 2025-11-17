#!/usr/bin/env ts-node

/**
 * SDK Example 3: Deploy ERC20 using Ethers.js Wallet
 *
 * This example demonstrates:
 * - Using a custom ethers.js Wallet instead of private key string
 * - SignerWallet wrapper for ethers.js Signer
 * - More control over wallet configuration
 * - Useful for integration with existing ethers.js code
 */

import { FeverDeployer, FileTracker } from '@fevertokens/sdk'
import { Wallet, JsonRpcProvider } from 'ethers'
import { resolve } from 'path'
import dotenv from 'dotenv'
import chalk from 'chalk'

// Load environment variables
dotenv.config()

async function main() {
  console.log(chalk.blue('╔═══════════════════════════════════════════════════╗'))
  console.log(chalk.blue('║   SDK Example 3: Using Ethers.js Wallet         ║'))
  console.log(chalk.blue('╚═══════════════════════════════════════════════════╝'))
  console.log()

  // Validate environment variables
  const privateKey = process.env.PRIVATE_KEY
  const rpcUrl = process.env.RPC_URL || 'http://localhost:8545'
  const chainId = parseInt(process.env.CHAIN_ID || '1337')

  if (!privateKey) {
    console.error(chalk.red('❌ Error: PRIVATE_KEY not set in .env'))
    console.log(chalk.yellow('💡 Copy .env.example to .env and configure'))
    process.exit(1)
  }

  console.log(chalk.cyan('📋 Configuration:'))
  console.log(chalk.gray(`   RPC URL: ${rpcUrl}`))
  console.log(chalk.gray(`   Chain ID: ${chainId}`))
  console.log(chalk.gray(`   Wallet Type: Ethers.js Wallet`))
  console.log()

  try {
    // Create ethers.js provider
    console.log(chalk.yellow('🔌 Creating ethers.js provider...'))
    const provider = new JsonRpcProvider(rpcUrl)
    console.log(chalk.green('✅ Provider created'))
    console.log()

    // Create ethers.js wallet from private key
    console.log(chalk.yellow('👛 Creating ethers.js wallet...'))
    const ethersWallet = new Wallet(privateKey, provider)
    const walletAddress = await ethersWallet.getAddress()
    console.log(chalk.green('✅ Wallet created'))
    console.log(chalk.gray(`   Address: ${walletAddress}`))
    console.log()

    // Initialize Fever SDK deployer with ethers Wallet directly
    // Note: SignerWallet wrapper is from @fevertokens/core and expects a compatible Signer
    console.log(chalk.yellow('⚙️  Initializing Fever SDK deployer...'))
    const deployer = new FeverDeployer({
      wallet: {
        type: 'signer',
        signer: ethersWallet as any
      },
      network: {
        chainId,
        rpcUrl
      },
      tracker: new FileTracker('.fever/deployments')
    })

    const deployerAddress = await deployer.getAddress()
    console.log(chalk.green('✅ Deployer initialized'))
    console.log(chalk.gray(`   Address: ${deployerAddress}`))
    console.log()

    // Get balance to verify connection
    console.log(chalk.yellow('💰 Checking wallet balance...'))
    const balance = await provider.getBalance(walletAddress)
    console.log(chalk.green('✅ Balance retrieved'))
    console.log(chalk.gray(`   Balance: ${balance.toString()} wei`))
    console.log(chalk.gray(`   Balance: ${Number(balance) / 1e18} ETH`))
    console.log()

    // Get the manifest file path
    const manifestPath = resolve(__dirname, '../../f9s/erc20-config.yaml')
    console.log(chalk.yellow('📄 Loading manifest...'))
    console.log(chalk.gray(`   Path: ${manifestPath}`))
    console.log()

    // Verify network connectivity
    console.log(chalk.yellow('🔌 Verifying network connectivity...'))
    const connectedChainId = await deployer.getChainId()
    console.log(chalk.green('✅ Network connected'))
    console.log(chalk.gray(`   Chain ID: ${connectedChainId}`))
    console.log()

    // Deploy from manifest
    console.log(chalk.yellow('🚀 Deploying ERC20 token with ethers.js wallet...'))
    const result = await deployer.deployFromFile(manifestPath, {
      skipConfirmation: true,
      forceRedeploy: false
    })

    console.log()
    console.log(chalk.green('╔═══════════════════════════════════════════════════╗'))
    console.log(chalk.green('║   ✅ Deployment Successful!                      ║'))
    console.log(chalk.green('╚═══════════════════════════════════════════════════╝'))
    console.log()
    console.log(chalk.cyan('📦 Deployment Details:'))
    console.log(chalk.gray(`   Contract: ${result.contractName}`))
    console.log(chalk.gray(`   Address: ${result.address}`))
    console.log(chalk.gray(`   Transaction: ${result.transactionHash}`))
    console.log(chalk.gray(`   Deployer: ${result.deployer}`))
    console.log(chalk.gray(`   Chain ID: ${result.chainId}`))
    console.log(chalk.gray(`   Block: ${result.blockNumber}`))
    console.log(chalk.gray(`   Gas Used: ${result.gasUsed}`))
    console.log()

    // Check updated balance after deployment
    console.log(chalk.yellow('💰 Checking updated balance...'))
    const newBalance = await provider.getBalance(walletAddress)
    const gasSpent = balance - newBalance
    console.log(chalk.green('✅ Balance updated'))
    console.log(chalk.gray(`   New Balance: ${Number(newBalance) / 1e18} ETH`))
    console.log(chalk.gray(`   Gas Spent: ${Number(gasSpent) / 1e18} ETH`))
    console.log()

    // Show deployment history
    console.log(chalk.cyan('📚 Deployment History:'))
    const deployments = await deployer.listDeployments()

    if (deployments.length > 0) {
      console.log(chalk.green(`   Found ${deployments.length} deployment(s):`))
      deployments.forEach((d: any, i: number) => {
        console.log(chalk.gray(`   ${i + 1}. ${d.contractName} at ${d.address}`))
      })
    } else {
      console.log(chalk.gray('   No previous deployments'))
    }
    console.log()

    console.log(chalk.green('╔═══════════════════════════════════════════════════╗'))
    console.log(chalk.green('║   🎉 Example Complete!                           ║'))
    console.log(chalk.green('╚═══════════════════════════════════════════════════╝'))
    console.log()
    console.log(chalk.cyan('💡 Key Takeaways:'))
    console.log(chalk.gray('   ✓ Use ethers.js Wallet for more control'))
    console.log(chalk.gray('   ✓ SignerWallet wraps any ethers.js Signer'))
    console.log(chalk.gray('   ✓ Easy integration with existing code'))
    console.log(chalk.gray('   ✓ Access to ethers.js features (balance, nonce, etc.)'))
    console.log()
    console.log(chalk.yellow('💡 When to use SignerWallet:'))
    console.log(chalk.gray('   • Already using ethers.js in your project'))
    console.log(chalk.gray('   • Need custom wallet configuration'))
    console.log(chalk.gray('   • Using hardware wallets or other signers'))
    console.log(chalk.gray('   • Want to check balance before deployment'))
    console.log()
    console.log(chalk.yellow('💡 Other Wallet Types:'))
    console.log(chalk.gray('   • PrivateKeyWallet - Simple private key string'))
    console.log(chalk.gray('   • MnemonicWallet - HD wallet from mnemonic'))
    console.log(chalk.gray('   • SignerWallet - Any ethers.js Signer (shown here)'))
    console.log(chalk.gray('   • EnvironmentWallet - Load from env variables'))
    console.log()

  } catch (error: any) {
    console.log()
    console.error(chalk.red('╔═══════════════════════════════════════════════════╗'))
    console.error(chalk.red('║   ❌ Deployment Failed                           ║'))
    console.error(chalk.red('╚═══════════════════════════════════════════════════╝'))
    console.error()
    console.error(chalk.red('Error:'), error.message)

    if (error.stack) {
      console.log()
      console.log(chalk.gray('Stack trace:'))
      console.log(chalk.gray(error.stack))
    }

    process.exit(1)
  }
}

// Run deployment
main().catch((error) => {
  console.error(chalk.red('Fatal error:'), error)
  process.exit(1)
})
