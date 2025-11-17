#!/usr/bin/env ts-node

/**
 * SDK Example 2: Deploy ERC20 Contract using JSON Manifest
 *
 * This example demonstrates:
 * - Using the SDK with a JSON manifest file
 * - JSON manifests work identically to YAML
 * - Same deployment flow with different manifest format
 * - Useful for programmatic manifest generation
 */

import { FeverDeployer, FileTracker } from '@fevertokens/sdk'
import { resolve } from 'path'
import dotenv from 'dotenv'
import chalk from 'chalk'

// Load environment variables
dotenv.config()

async function main() {
  console.log(chalk.blue('╔═══════════════════════════════════════════════════╗'))
  console.log(chalk.blue('║   SDK Example 2: ERC20 Deployment (JSON)        ║'))
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
  console.log(chalk.gray(`   Manifest Type: JSON`))
  console.log()

  try {
    // Initialize Fever SDK deployer
    console.log(chalk.yellow('⚙️  Initializing Fever SDK deployer...'))
    const deployer = new FeverDeployer({
      wallet: {
        type: 'privateKey',
        value: privateKey
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

    // Get the JSON manifest file path
    const manifestPath = resolve(__dirname, '../../f9s/erc20-config.json')
    console.log(chalk.yellow('📄 Loading JSON manifest...'))
    console.log(chalk.gray(`   Path: ${manifestPath}`))
    console.log()

    // Verify network connectivity
    console.log(chalk.yellow('🔌 Verifying network connectivity...'))
    const connectedChainId = await deployer.getChainId()
    console.log(chalk.green('✅ Network connected'))
    console.log(chalk.gray(`   Chain ID: ${connectedChainId}`))
    console.log()

    // Deploy from JSON manifest
    console.log(chalk.yellow('🚀 Deploying ERC20 token from JSON manifest...'))
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
    console.log(chalk.gray('   ✓ JSON manifests work identically to YAML'))
    console.log(chalk.gray('   ✓ JSON is easier to generate programmatically'))
    console.log(chalk.gray('   ✓ Same validation and deployment flow'))
    console.log(chalk.gray('   ✓ Choose format based on your use case'))
    console.log()
    console.log(chalk.yellow('💡 Use Cases for JSON:'))
    console.log(chalk.gray('   • CI/CD pipelines generating manifests'))
    console.log(chalk.gray('   • Programmatic deployment orchestration'))
    console.log(chalk.gray('   • Integration with build systems'))
    console.log(chalk.gray('   • Dynamic configuration from databases'))
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
