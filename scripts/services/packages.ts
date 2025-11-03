import { FunctionFragment, Signer, BaseContract, ContractFactory, InterfaceAbi, Interface, BytesLike } from 'ethers';
import { Abi, AbiConstructor, AbiFunction, AbiEvent, AbiError } from 'abitype';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

// Load contract artifacts
const metadataPath = join(__dirname, '../../metadata/combined.json');
if (!existsSync(metadataPath)) {
  throw new Error('Combined metadata not found. Run `npm run compile` first.');
}

const artifactData = JSON.parse(readFileSync(metadataPath, 'utf8'));
const AllArtifacts = artifactData.contracts;

export enum FacetCutAction {
  Add,
  Replace,
  Remove,
}

export interface DiamondCut {
  target: string;
  action: FacetCutAction;
  selectors: string[];
}

export interface ContractArtifact {
  file: string;
  name: string;
  abi: Abi;
  bytecode?: string;
  constructor?: AbiConstructor;
  functions?: AbiFunction[];
  events?: AbiEvent[];
  errors?: AbiError[];
}

// Process artifacts into structured format
const artifacts: ContractArtifact[] = Object.keys(AllArtifacts).map(key => {
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
    constructor: artifact.abi.filter((item: any) => item.type === 'constructor')[0],
    functions: artifact.abi.filter((item: any) => item.type === 'function' && !item.name?.endsWith('_init')),
    events: artifact.abi.filter((item: any) => item.type === 'event'),
    errors: artifact.abi.filter((item: any) => item.type === 'error'),
  };
});

export function getContractArtifact(contractArtifactName: string): ContractArtifact {
  const artifact = artifacts.find(artifact => artifact.name === contractArtifactName);
  if (!artifact) {
    throw new Error(`Artifact ${contractArtifactName} not found in compilation result`);
  }
  return artifact;
}

export function getAbi(contractArtifactName: string): Abi {
  const artifact = getContractArtifact(contractArtifactName);
  return artifact.abi;
}

export function getEthersAbi(contractArtifactName: string): InterfaceAbi {
  const artifact = getContractArtifact(contractArtifactName);
  // Convert abitype.Abi to ethers InterfaceAbi by JSON serialization
  return JSON.parse(JSON.stringify(artifact.abi)) as InterfaceAbi;
}

export function getAbiFunction(contractArtifactName: string, functionName: string): AbiFunction {
  const abi = getAbi(contractArtifactName);
  
  const abiFunction = abi.find((item: any) => item.type === 'function' && item.name === functionName);
  if (!abiFunction) {
    throw new Error(`Function ${functionName} not found in ${contractArtifactName}`);
  }
  
  return abiFunction as AbiFunction;
}

export function getFunctionSelector(abiFunction: AbiFunction): string {
  const functionFragment = FunctionFragment.from(abiFunction);
  return functionFragment.selector;
}

export function getFunctions(contractArtifactName: string): string[] {
  const artifact = getContractArtifact(contractArtifactName);
  
  if (!artifact.functions || artifact.functions.length === 0) {
    throw new Error(`Artifact ${contractArtifactName} does not have any functions`);
  }

  return artifact.functions.map(func => func.name);
}

export function getSelectors(contractArtifactName: string): string[] {
  const artifact = getContractArtifact(contractArtifactName);
  
  if (!artifact.functions || artifact.functions.length === 0) {
    throw new Error(`Artifact ${contractArtifactName} does not have any functions`);
  }

  return artifact.functions.map(func => getFunctionSelector(func));
}

export async function deployContract(
  contractArtifactName: string,
  signer: Signer,
  constructorParams?: any[],
): Promise<BaseContract> {
  const contractArtifact = getContractArtifact(contractArtifactName);
  const artifactAbi = contractArtifact.abi as InterfaceAbi;
  const artifactBytecode = contractArtifact.bytecode;

  if (!artifactBytecode) {
    throw new Error(`Artifact ${contractArtifactName} does not have any bytecode`);
  }

  if (constructorParams && !contractArtifact.constructor) {
    throw new Error(`Artifact ${contractArtifactName} does not have a constructor`);
  }

  const contractFactory = new ContractFactory(artifactAbi, artifactBytecode, signer);
  const contract = constructorParams 
    ? await contractFactory.deploy(...constructorParams)
    : await contractFactory.deploy();

  await contract.deploymentTransaction()?.wait();
  return contract;
}

export async function deployPackage(
  contractArtifactName: string,
  signer: Signer,
  constructorParams?: any[],
): Promise<DiamondCut> {
  const contract = constructorParams
    ? await deployContract(contractArtifactName, signer, constructorParams)
    : await deployContract(contractArtifactName, signer);

  const selectors = getSelectors(contractArtifactName);

  return {
    target: contract.target as string,
    action: FacetCutAction.Add,
    selectors,
  };
}

export async function deployERC3643(admin: Signer, manager?: Signer, relayer?: Signer, auditor?: Signer) {
  let deployedPackages: any[] = [];

  const adminAddress = await admin.getAddress();
  const managerAddress = manager ? await manager.getAddress() : adminAddress;
  const relayerAddress = relayer ? await relayer.getAddress() : adminAddress;
  const auditorAddress = auditor ? await auditor.getAddress() : adminAddress;

  /// Deploy ERC3643 packages
  const erc3643BasePackages: any[] = [
    { packageName: 'PackageController' },
    { packageName: 'PackageViewer' },
    { packageName: 'InitializerPackage' },
    { packageName: 'AgentRole' }, // Changed from AccessControlPackage to AgentRole
  ];

  const erc3643BasePackagesPromises = erc3643BasePackages.map(async basePackage => {
    let contract: BaseContract;

    if (basePackage.constructorParams) {
      contract = await deployContract(basePackage.packageName, admin, basePackage.constructorParams);
    } else {
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
  deployedPackages.push(
    { name: 'Token', address: token.target },
    { name: 'IdentityRegistry', address: identityRegistry.target },
    { name: 'Compliance', address: compliance.target }
  );

  // Deploy ERC3643 diamond

  const erc3643DiamondContract = await deployContract('MicroLoanPackageSystem', admin, [
    packageControllerAddress,
    packageViewerAddress,
    initializerPackageAddress,
    agentRolePackageAddress,
    adminAddress,
  ]);

  const erc3643DiamondAddress = await erc3643DiamondContract.getAddress();

  const erc3643Artifact = getContractArtifact('MicroLoanPackageSystem');
  const erc3643Bytecode = erc3643Artifact.bytecode as BytesLike;

  let erc3643Abi: Abi[] = [];
  deployedPackages.forEach(deployedPackage => {
    erc3643Abi = erc3643Abi.concat(getAbi(deployedPackage.name));
  });
  erc3643Abi = erc3643Abi.filter(item => (item as any).type !== 'constructor');
  erc3643Abi = erc3643Abi.concat(erc3643Artifact.abi.filter((item: any) => item.type == 'constructor'));

  const erc3643Factory = new ContractFactory(erc3643Abi as InterfaceAbi, erc3643Bytecode, admin);

  const erc3643Diamond = (await erc3643Factory.attach(erc3643DiamondAddress)) as any;

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
  const packageControllerInterface = new Interface(packageControllerABI as InterfaceAbi);

  const initPackageControllerObject = [
    '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
  ];
  const initPackageControllerData = packageControllerInterface.encodeFunctionData(
    'PackageController_init(address,address)',
    initPackageControllerObject,
  );
  console.log({ initPackageControllerData });
};

if (require.main === module) {
  // main();
  getbinary();
}
