#!/usr/bin/env ts-node

/**
 * SDK Example 4: Programmatic Manifest Deployment
 *
 * This example demonstrates:
 * - Using deploy() with manifest objects (no file needed!)
 * - Creating manifests programmatically
 * - Deploying multiple contracts in a loop
 * - Dynamic manifest generation based on configuration
 * - Automatic kind-based routing (Contract, Package, PackageSystem)
 */

import { FeverDeployer, FileTracker, DeploymentManifest } from '@fevertokens/sdk'
import dotenv from 'dotenv'
import chalk from 'chalk'

// Load environment variables
dotenv.config()

async function main() {
  console.log(chalk.blue('╔═══════════════════════════════════════════════════╗'))
  console.log(chalk.blue('║   SDK Example 4: Programmatic Deployment        ║'))
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
  console.log(chalk.gray(`   Method: deploy() with manifest objects`))
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

    // Verify network connectivity
    console.log(chalk.yellow('🔌 Verifying network connectivity...'))
    const connectedChainId = await deployer.getChainId()
    console.log(chalk.green('✅ Network connected'))
    console.log(chalk.gray(`   Chain ID: ${connectedChainId}`))
    console.log()

    // ========================================================================
    // Example 1: Deploy single contract with programmatic manifest
    // ========================================================================
    console.log(chalk.blue('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'))
    console.log(chalk.blue('  Example 1: Single Contract Deployment'))
    console.log(chalk.blue('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'))
    console.log()

    // Create manifest object programmatically
    const contractManifest: DeploymentManifest = {
      apiVersion: 'beta/v1',
      kind: 'Contract',
      metadata: {
        name: 'usdc-token',
        version: '1.0.0',
        description: 'USDC stablecoin created programmatically'
      },
      spec: {
        deployer: {
          wallet: {
            type: 'privateKey',
            value: privateKey
          }
        },
        contract: {
          name: 'StableCoin',
          constructorArgs: [
            { name: 'name_', type: 'string', value: 'USD Coin' },
            { name: 'symbol_', type: 'string', value: 'USDC' },
            { name: 'decimals_', type: 'uint8', value: 6 }
          ]
        }
      }
    }

    console.log(chalk.yellow('📄 Created manifest object:'))
    console.log(chalk.gray(JSON.stringify(contractManifest, null, 2)))
    console.log()

    console.log(chalk.yellow('🚀 Deploying with deploy() method...'))
    const result1 = await deployer.deploy(contractManifest, {
      skipConfirmation: true,
      forceRedeploy: false
    })

    console.log()
    console.log(chalk.green('✅ Deployment 1 Complete:'))
    console.log(chalk.gray(`   Contract: ${result1.contractName}`))
    console.log(chalk.gray(`   Address: ${result1.address}`))
    console.log(chalk.gray(`   Transaction: ${result1.transactionHash}`))
    console.log()

    // ========================================================================
    // Example 2: Deploy multiple contracts in a loop
    // ========================================================================
    console.log(chalk.blue('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'))
    console.log(chalk.blue('  Example 2: Batch Deployment (Multiple Tokens)'))
    console.log(chalk.blue('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'))
    console.log()

    // Configuration for multiple tokens
    const tokenConfigs = [
      { name: 'Tether USD', symbol: 'USDT', decimals: 6 },
      { name: 'Dai Stablecoin', symbol: 'DAI', decimals: 18 },
      { name: 'Binance USD', symbol: 'BUSD', decimals: 18 }
    ]

    const deployedTokens: any[] = []

    for (const [index, config] of tokenConfigs.entries()) {
      console.log(chalk.cyan(`\n[${index + 1}/${tokenConfigs.length}] Deploying ${config.symbol}...`))

      // Generate manifest programmatically for each token
      const tokenManifest: DeploymentManifest = {
        apiVersion: 'beta/v1',
        kind: 'Contract',
        metadata: {
          name: `${config.symbol.toLowerCase()}-token`,
          version: '1.0.0',
          description: `${config.name} deployment`
        },
        spec: {
          deployer: {
            wallet: {
              type: 'privateKey',
              value: privateKey
            }
          },
          contract: {
            name: 'StableCoin',
            constructorArgs: [
              { value: config.name },
              { value: config.symbol },
              { value: config.decimals }
            ]
          }
        }
      }

      const result = await deployer.deploy(tokenManifest)

      deployedTokens.push({
        symbol: config.symbol,
        address: result.address,
        tx: result.transactionHash
      })

      console.log(chalk.green(`   ✅ ${config.symbol} deployed at ${result.address}`))
    }

    console.log()
    console.log(chalk.green('✅ Batch Deployment Complete!'))
    console.log(chalk.cyan('\n📊 Deployed Tokens Summary:'))
    deployedTokens.forEach((token, i) => {
      console.log(chalk.gray(`   ${i + 1}. ${token.symbol.padEnd(6)} → ${token.address}`))
    })
    console.log()

    // ========================================================================
    // Example 3: Dynamic manifest based on environment
    // ========================================================================
    console.log(chalk.blue('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'))
    console.log(chalk.blue('  Example 3: Dynamic Manifest (Environment-based)'))
    console.log(chalk.blue('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'))
    console.log()

    // Simulate loading config from environment/database/API
    const envConfig = {
      tokenName: process.env.TOKEN_NAME || 'Test Token',
      tokenSymbol: process.env.TOKEN_SYMBOL || 'TEST',
      tokenDecimals: parseInt(process.env.TOKEN_DECIMALS || '18')
    }

    console.log(chalk.yellow('📋 Environment Configuration:'))
    console.log(chalk.gray(`   Name: ${envConfig.tokenName}`))
    console.log(chalk.gray(`   Symbol: ${envConfig.tokenSymbol}`))
    console.log(chalk.gray(`   Decimals: ${envConfig.tokenDecimals}`))
    console.log()

    // Create manifest dynamically from environment
    const dynamicManifest: DeploymentManifest = {
      apiVersion: 'beta/v1',
      kind: 'Contract',
      metadata: {
        name: `${envConfig.tokenSymbol.toLowerCase()}-deployment`,
        version: '1.0.0',
        description: `Dynamic deployment of ${envConfig.tokenName}`
      },
      spec: {
        deployer: {
          wallet: {
            type: 'privateKey',
            value: privateKey
          }
        },
        contract: {
          name: 'StableCoin',
          constructorArgs: [
            { value: envConfig.tokenName },
            { value: envConfig.tokenSymbol },
            { value: envConfig.tokenDecimals }
          ]
        }
      }
    }

    console.log(chalk.yellow('🚀 Deploying with dynamic manifest...'))
    const result3 = await deployer.deploy(dynamicManifest)

    console.log()
    console.log(chalk.green('✅ Dynamic Deployment Complete:'))
    console.log(chalk.gray(`   Contract: ${result3.contractName}`))
    console.log(chalk.gray(`   Address: ${result3.address}`))
    console.log()

    // ========================================================================
    // Show final deployment history
    // ========================================================================
    console.log(chalk.blue('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'))
    console.log(chalk.blue('  Final Deployment History'))
    console.log(chalk.blue('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'))
    console.log()

    const deployments = await deployer.listDeployments()
    console.log(chalk.cyan(`📚 Total Deployments: ${deployments.length}`))

    // Show last 10
    const recentDeployments = deployments.slice(-10)
    console.log(chalk.gray(`\n   Showing last ${recentDeployments.length} deployments:`))
    recentDeployments.forEach((d: any, i: number) => {
      const index = deployments.length - recentDeployments.length + i + 1
      console.log(chalk.gray(`   ${index}. ${d.contractName} at ${d.address}`))
    })
    console.log()

    // ========================================================================
    // Summary
    // ========================================================================
    console.log(chalk.green('╔═══════════════════════════════════════════════════╗'))
    console.log(chalk.green('║   🎉 Programmatic Deployment Complete!          ║'))
    console.log(chalk.green('╚═══════════════════════════════════════════════════╝'))
    console.log()
    console.log(chalk.cyan('💡 Key Takeaways:'))
    console.log(chalk.gray('   ✓ deploy() accepts manifest objects directly'))
    console.log(chalk.gray('   ✓ No file I/O required - purely in-memory'))
    console.log(chalk.gray('   ✓ Perfect for batch deployments'))
    console.log(chalk.gray('   ✓ Automatic routing based on manifest.kind'))
    console.log(chalk.gray('   ✓ Ideal for CI/CD and automation'))
    console.log()
    console.log(chalk.yellow('💡 Use Cases:'))
    console.log(chalk.gray('   • Deploying from API responses'))
    console.log(chalk.gray('   • Batch deployments in loops'))
    console.log(chalk.gray('   • Dynamic configuration at runtime'))
    console.log(chalk.gray('   • Testing with generated manifests'))
    console.log(chalk.gray('   • Integration with existing systems'))
    console.log()
    console.log(chalk.yellow('💡 Supported Manifest Kinds:'))
    console.log(chalk.gray('   • Contract - Regular smart contracts'))
    console.log(chalk.gray('   • Package - POF package/facet contracts'))
    console.log(chalk.gray('   • PackageSystem - Diamond proxy systems'))
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
