"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const hardhat_1 = __importDefault(require("hardhat"));
const packages_1 = require("./services/packages");
async function main() {
    const [admin, user1, user2] = await hardhat_1.default.ethers.getSigners();
    console.log('Deploying ERC3643 contracts...');
    console.log('Admin address:', admin.address);
    try {
        // Deploy core packages first
        console.log('\n1. Deploying PackageController...');
        const packageController = await (0, packages_1.deployContract)('PackageController', admin);
        console.log('PackageController deployed to:', packageController.target);
        console.log('\n2. Deploying PackageViewer...');
        const packageViewer = await (0, packages_1.deployContract)('PackageViewer', admin);
        console.log('PackageViewer deployed to:', packageViewer.target);
        console.log('\n3. Deploying InitializablePackage...');
        const initializablePackage = await (0, packages_1.deployContract)('InitializablePackage', admin);
        console.log('InitializablePackage deployed to:', initializablePackage.target);
        console.log('\n4. Deploying AgentRole...');
        const agentRole = await (0, packages_1.deployContract)('AgentRole', admin);
        console.log('AgentRole deployed to:', agentRole.target);
        console.log('\n5. Deploying MicroLoanDiamond...');
        const erc3643Diamond = await (0, packages_1.deployContract)('MicroLoanDiamond', admin, [
            packageController.target,
            packageViewer.target,
            initializablePackage.target,
            agentRole.target,
            admin.address
        ]);
        console.log('MicroLoanDiamond deployed to:', erc3643Diamond.target);
        // Deploy supporting ERC3643 contracts
        console.log('\n6. Deploying ERC3643 supporting contracts...');
        const token = await (0, packages_1.deployContract)('Token', admin);
        console.log('Token deployed to:', token.target);
        const identityRegistry = await (0, packages_1.deployContract)('IdentityRegistry', admin);
        console.log('IdentityRegistry deployed to:', identityRegistry.target);
        const compliance = await (0, packages_1.deployContract)('Compliance', admin);
        console.log('Compliance deployed to:', compliance.target);
        const trustedIssuersRegistry = await (0, packages_1.deployContract)('TrustedIssuersRegistry', admin);
        console.log('TrustedIssuersRegistry deployed to:', trustedIssuersRegistry.target);
        const claimTopicsRegistry = await (0, packages_1.deployContract)('ClaimTopicsRegistry', admin);
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
        const { getAbi } = await Promise.resolve().then(() => __importStar(require('./services/packages')));
        const packageViewerAbi = getAbi('PackageViewer');
        // Create interface with PackageViewer ABI to test facetAddresses
        const diamondWithViewer = new hardhat_1.default.ethers.Contract(erc3643Diamond.target, packageViewerAbi, admin);
        // Get facet addresses
        const facetAddresses = await diamondWithViewer.facetAddresses();
        console.log('Diamond facet addresses:', facetAddresses);
        console.log('Number of facets:', facetAddresses.length);
        // Test AgentRole functionality
        const agentRoleAbi = getAbi('AgentRole');
        const diamondWithAgent = new hardhat_1.default.ethers.Contract(erc3643Diamond.target, agentRoleAbi, admin);
        await diamondWithAgent.addAgent(user1.address);
        const isAgent = await diamondWithAgent.isAgent(user1.address);
        console.log(`Added ${user1.address} as agent:`, isAgent);
    }
    catch (error) {
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
