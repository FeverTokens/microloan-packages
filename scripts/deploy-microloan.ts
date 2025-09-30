import hre from 'hardhat';
import "@nomicfoundation/hardhat-ethers";
import { deployContract } from './services/packages';

async function main() {
  const [admin, user1, user2] = await hre.ethers.getSigners();
  
  console.log('Deploying ERC3643 contracts...');
  console.log('Admin address:', admin.address);

  try {
    // Deploy core packages first
    console.log('\n1. Deploying PackageController...');
    const packageController = await deployContract('PackageController', admin);
    console.log('PackageController deployed to:', packageController.target);

    console.log('\n2. Deploying PackageViewer...');
    const packageViewer = await deployContract('PackageViewer', admin);
    console.log('PackageViewer deployed to:', packageViewer.target);

    console.log('\n3. Deploying InitializablePackage...');
    const initializablePackage = await deployContract('InitializablePackage', admin);
    console.log('InitializablePackage deployed to:', initializablePackage.target);

    console.log('\n4. Deploying AgentRole...');
    const agentRole = await deployContract('AgentRole', admin);
    console.log('AgentRole deployed to:', agentRole.target);

    console.log('\n5. Deploying MicroLoanDiamond...');
    const erc3643Diamond = await deployContract('MicroLoanDiamond', admin, [
      packageController.target,
      packageViewer.target,
      initializablePackage.target,
      agentRole.target,
      admin.address
    ]);
    console.log('MicroLoanDiamond deployed to:', erc3643Diamond.target);

    // Deploy supporting ERC3643 contracts
    console.log('\n6. Deploying ERC3643 supporting contracts...');
    
    const token = await deployContract('Token', admin);
    console.log('Token deployed to:', token.target);

    const identityRegistry = await deployContract('IdentityRegistry', admin);
    console.log('IdentityRegistry deployed to:', identityRegistry.target);

    const compliance = await deployContract('Compliance', admin);
    console.log('Compliance deployed to:', compliance.target);

    const trustedIssuersRegistry = await deployContract('TrustedIssuersRegistry', admin);
    console.log('TrustedIssuersRegistry deployed to:', trustedIssuersRegistry.target);

    const claimTopicsRegistry = await deployContract('ClaimTopicsRegistry', admin);
    console.log('ClaimTopicsRegistry deployed to:', claimTopicsRegistry.target);

    console.log('\n✅ All contracts deployed successfully!');
    console.log('\nSummary:');
    console.log(`MicroLoanDiamond: ${erc3643Diamond.target}`);
    console.log(`Token: ${token.target}`);
    console.log(`IdentityRegistry: ${identityRegistry.target}`);
    console.log(`Compliance: ${compliance.target}`);
    console.log(`TrustedIssuersRegistry: ${trustedIssuersRegistry.target}`);
    console.log(`ClaimTopicsRegistry: ${claimTopicsRegistry.target}`);

    // Test basic functionality
    console.log('\n7. Testing basic functionality...');
    
    // Get the correct ABI for the diamond by combining all facet ABIs
    const { getAbi } = await import('./services/packages');
    const packageViewerAbi = getAbi('PackageViewer');
    
    // Create interface with PackageViewer ABI to test facetAddresses
    const diamondWithViewer = new hre.ethers.Contract(
      erc3643Diamond.target as string,
      packageViewerAbi as any,
      admin
    );
    
    // Get facet addresses
    const facetAddresses = await diamondWithViewer.facetAddresses();
    console.log('Diamond facet addresses:', facetAddresses);
    console.log('Number of facets:', facetAddresses.length);
    
    // Test AgentRole functionality
    const agentRoleAbi = getAbi('AgentRole');
    const diamondWithAgent = new hre.ethers.Contract(
      erc3643Diamond.target as string,
      agentRoleAbi as any,
      admin
    );
    
    await diamondWithAgent.addAgent(user1.address);
    const isAgent = await diamondWithAgent.isAgent(user1.address);
    console.log(`Added ${user1.address} as agent:`, isAgent);

  } catch (error) {
    console.error('Deployment failed:', error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
