"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deployERC3643 = exports.deployPackage = exports.deployContract = exports.getSelectors = exports.getFunctions = exports.getFunctionSelector = exports.getAbiFunction = exports.getAbi = exports.getContractArtifact = exports.FacetCutAction = void 0;
const ethers_1 = require("ethers");
const fs_1 = require("fs");
const path_1 = require("path");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Load contract artifacts
const metadataPath = (0, path_1.join)(__dirname, '../../metadata/combined.json');
if (!(0, fs_1.existsSync)(metadataPath)) {
    throw new Error('Combined metadata not found. Run `npm run compile` first.');
}
const artifactData = JSON.parse((0, fs_1.readFileSync)(metadataPath, 'utf8'));
const AllArtifacts = artifactData.contracts;
var FacetCutAction;
(function (FacetCutAction) {
    FacetCutAction[FacetCutAction["Add"] = 0] = "Add";
    FacetCutAction[FacetCutAction["Replace"] = 1] = "Replace";
    FacetCutAction[FacetCutAction["Remove"] = 2] = "Remove";
})(FacetCutAction = exports.FacetCutAction || (exports.FacetCutAction = {}));
// Process artifacts into structured format
const artifacts = Object.keys(AllArtifacts).map(key => {
    // Handle both formats: "file:name" and just "name"
    const parts = key.split(':');
    const file = parts.length > 1 ? parts[0] : '';
    const name = parts.length > 1 ? parts[1] : key;
    const artifact = AllArtifacts[key];
    return {
        file,
        name,
        abi: artifact.abi,
        bytecode: artifact.bin,
        constructor: artifact.abi.filter((item) => item.type === 'constructor')[0],
        functions: artifact.abi.filter((item) => { var _a; return item.type === 'function' && !((_a = item.name) === null || _a === void 0 ? void 0 : _a.endsWith('_init')); }),
        events: artifact.abi.filter((item) => item.type === 'event'),
        errors: artifact.abi.filter((item) => item.type === 'error'),
    };
});
function getContractArtifact(contractArtifactName) {
    const artifact = artifacts.find(artifact => artifact.name === contractArtifactName);
    if (!artifact) {
        throw new Error(`Artifact ${contractArtifactName} not found in compilation result`);
    }
    return artifact;
}
exports.getContractArtifact = getContractArtifact;
function getAbi(contractArtifactName) {
    const artifact = getContractArtifact(contractArtifactName);
    return artifact.abi;
}
exports.getAbi = getAbi;
function getAbiFunction(contractArtifactName, functionName) {
    const abi = getAbi(contractArtifactName);
    const abiFunction = abi.find((item) => item.type === 'function' && item.name === functionName);
    if (!abiFunction) {
        throw new Error(`Function ${functionName} not found in ${contractArtifactName}`);
    }
    return abiFunction;
}
exports.getAbiFunction = getAbiFunction;
function getFunctionSelector(abiFunction) {
    const functionFragment = ethers_1.FunctionFragment.from(abiFunction);
    return functionFragment.selector;
}
exports.getFunctionSelector = getFunctionSelector;
function getFunctions(contractArtifactName) {
    const artifact = getContractArtifact(contractArtifactName);
    if (!artifact.functions || artifact.functions.length === 0) {
        throw new Error(`Artifact ${contractArtifactName} does not have any functions`);
    }
    return artifact.functions.map(func => func.name);
}
exports.getFunctions = getFunctions;
function getSelectors(contractArtifactName) {
    const artifact = getContractArtifact(contractArtifactName);
    if (!artifact.functions || artifact.functions.length === 0) {
        throw new Error(`Artifact ${contractArtifactName} does not have any functions`);
    }
    return artifact.functions.map(func => getFunctionSelector(func));
}
exports.getSelectors = getSelectors;
async function deployContract(contractArtifactName, signer, constructorParams) {
    var _a;
    const contractArtifact = getContractArtifact(contractArtifactName);
    const artifactAbi = contractArtifact.abi;
    const artifactBytecode = contractArtifact.bytecode;
    if (!artifactBytecode) {
        throw new Error(`Artifact ${contractArtifactName} does not have any bytecode`);
    }
    if (constructorParams && !contractArtifact.constructor) {
        throw new Error(`Artifact ${contractArtifactName} does not have a constructor`);
    }
    const contractFactory = new ethers_1.ContractFactory(artifactAbi, artifactBytecode, signer);
    const contract = constructorParams
        ? await contractFactory.deploy(...constructorParams)
        : await contractFactory.deploy();
    await ((_a = contract.deploymentTransaction()) === null || _a === void 0 ? void 0 : _a.wait());
    return contract;
}
exports.deployContract = deployContract;
async function deployPackage(contractArtifactName, signer, constructorParams) {
    const contract = constructorParams
        ? await deployContract(contractArtifactName, signer, constructorParams)
        : await deployContract(contractArtifactName, signer);
    const selectors = getSelectors(contractArtifactName);
    return {
        target: contract.target,
        action: FacetCutAction.Add,
        selectors,
    };
}
exports.deployPackage = deployPackage;
async function deployERC3643(admin, manager, relayer, auditor) {
    let deployedPackages = [];
    const adminAddress = await admin.getAddress();
    const managerAddress = manager ? await manager.getAddress() : adminAddress;
    const relayerAddress = relayer ? await relayer.getAddress() : adminAddress;
    const auditorAddress = auditor ? await auditor.getAddress() : adminAddress;
    /// Deploy ERC3643 packages
    const erc3643BasePackages = [
        { packageName: 'PackageController' },
        { packageName: 'PackageViewer' },
        { packageName: 'InitializerPackage' },
        { packageName: 'AgentRole' }, // Changed from AccessControlPackage to AgentRole
    ];
    const erc3643BasePackagesPromises = erc3643BasePackages.map(async (basePackage) => {
        let contract;
        if (basePackage.constructorParams) {
            contract = await deployContract(basePackage.packageName, admin, basePackage.constructorParams);
        }
        else {
            contract = await deployContract(basePackage.packageName, admin);
        }
        return { name: basePackage.packageName, address: contract.target };
    });
    // Use Promise.all to await all promises in parallel
    deployedPackages = await Promise.all(erc3643BasePackagesPromises);
    const packageControllerAddress = deployedPackages.filter(p => p.name === 'PackageController')[0].address;
    const packageViewerAddress = deployedPackages.filter(p => p.name === 'PackageViewer')[0].address;
    const initializerPackageAddress = deployedPackages.filter(p => p.name === 'InitializerPackage')[0].address;
    const agentRolePackageAddress = deployedPackages.filter(p => p.name === 'AgentRole')[0].address;
    // Deploy ERC3643 supporting contracts
    const token = await deployContract('Token', admin);
    const identityRegistry = await deployContract('IdentityRegistry', admin);
    const compliance = await deployContract('Compliance', admin);
    // Add ERC3643 contracts to deployed packages
    deployedPackages.push({ name: 'Token', address: token.target }, { name: 'IdentityRegistry', address: identityRegistry.target }, { name: 'Compliance', address: compliance.target });
    // Deploy ERC3643 diamond
    const erc3643DiamondContract = await deployContract('MicroLoanDiamond', admin, [
        packageControllerAddress,
        packageViewerAddress,
        initializerPackageAddress,
        agentRolePackageAddress,
        adminAddress,
    ]);
    const erc3643DiamondAddress = await erc3643DiamondContract.getAddress();
    const erc3643Artifact = getContractArtifact('MicroLoanDiamond');
    const erc3643Bytecode = erc3643Artifact.bytecode;
    let erc3643Abi = [];
    deployedPackages.forEach(deployedPackage => {
        erc3643Abi = erc3643Abi.concat(getAbi(deployedPackage.name));
    });
    erc3643Abi = erc3643Abi.filter(item => item.type !== 'constructor');
    erc3643Abi = erc3643Abi.concat(erc3643Artifact.abi.filter((item) => item.type == 'constructor'));
    const erc3643Factory = new ethers_1.ContractFactory(erc3643Abi, erc3643Bytecode, admin);
    const erc3643Diamond = (await erc3643Factory.attach(erc3643DiamondAddress));
    return {
        admin,
        manager: manager || admin,
        relayer: relayer || admin,
        auditor: auditor || admin,
        erc3643Abi,
        deployedPackages,
        erc3643Diamond,
        erc3643DiamondAddress,
    };
}
exports.deployERC3643 = deployERC3643;
const main = async () => {
    console.log('Testing scripts');
    const abiFunction = await getAbiFunction('PackageController', 'diamondCut');
    console.log({ abiFunction });
    const selector = getFunctionSelector(abiFunction);
    console.log({ selector });
};
const getbinary = () => {
    // Deploy diamond with base packages
    const packageControllerABI = getAbi('PackageController');
    const packageControllerInterface = new ethers_1.Interface(packageControllerABI);
    const initPackageControllerObject = [
        '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
        '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    ];
    const initPackageControllerData = packageControllerInterface.encodeFunctionData('PackageController_init(address,address)', initPackageControllerObject);
    console.log({ initPackageControllerData });
};
if (require.main === module) {
    // main();
    getbinary();
}
