import hre from 'hardhat';
import dotenv from 'dotenv';
import { JsonRpcProvider, Wallet } from 'ethers';

dotenv.config();

async function main() {
  const rpcUrl = process.env.RPC_URL;
  const chainIdEnv = process.env.CHAIN_ID;
  const pkRaw = process.env.DEPLOYER_PRIVATE_KEY || process.env.PRIVATE_KEY;

  if (!rpcUrl) throw new Error('RPC_URL is not set in .env');
  if (!chainIdEnv) throw new Error('CHAIN_ID is not set in .env');
  if (!pkRaw) throw new Error('DEPLOYER_PRIVATE_KEY or PRIVATE_KEY is not set in .env');

  const chainId = parseInt(chainIdEnv, 10);
  const privateKey = pkRaw.startsWith('0x') ? pkRaw : `0x${pkRaw}`;

  const provider = new JsonRpcProvider(rpcUrl, chainId);
  const deployer = new Wallet(privateKey, provider);
  console.log('Network RPC:', rpcUrl);
  console.log('Chain ID   :', chainId);
  console.log('Deployer   :', deployer.address);

  // Parameters for the mock stablecoin
  const name = 'MockUSDC';
  const symbol = 'mUSDC';
  const decimals = 6;

  // Deploy StableCoin
  const StableCoin = await hre.ethers.getContractFactory('StableCoin', deployer);
  const stable = await StableCoin.deploy(name, symbol, decimals);
  await stable.waitForDeployment();

  const addr = await stable.getAddress();
  console.log('StableCoin deployed');
  console.log('  Name    :', name);
  console.log('  Symbol  :', symbol);
  console.log('  Decimals:', decimals);
  console.log('  Address :', addr);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
