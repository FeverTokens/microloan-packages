import { ethers } from "ethers";

import * as dotenv from "dotenv";
dotenv.config();

export const TRANSACTION_ALLOWLIST_ADDRESS =
  "0x0200000000000000000000000000000000000002";

export const TRANSACTION_ALLOWLIST_ABI = [
  {
    inputs: [{ name: "addr", type: "address" }],
    name: "setAdmin",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "addr", type: "address" }],
    name: "setEnabled",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "addr", type: "address" }],
    name: "setManager",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "addr", type: "address" }],
    name: "setNone",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "addr", type: "address" }],
    name: "readAllowList",
    outputs: [{ name: "role", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
];

export enum Role {
  NONE = 0,
  ENABLED = 1,
  ADMIN = 2,
  MANAGER = 3,
}

export interface RoleAssignmentResult {
  roleTx: ethers.TransactionResponse;
  transferTx: ethers.TransactionResponse;
}

type ProviderOrSigner =
  | ethers.BrowserProvider
  | ethers.JsonRpcProvider
  | ethers.Signer;

async function resolveSigner(
  providerOrSigner: ProviderOrSigner,
): Promise<ethers.Signer> {
  const maybeSigner = providerOrSigner as ethers.Signer;
  if (typeof (maybeSigner as any).getAddress === "function") {
    return maybeSigner;
  }
  const maybeProvider = providerOrSigner as any;
  if (typeof maybeProvider.getSigner === "function") {
    return await maybeProvider.getSigner();
  }
  throw new Error(
    "A Signer or a provider capable of returning a signer is required",
  );
}

function resolveReadRunner(providerOrSigner: ProviderOrSigner): any {
  const maybeSigner = providerOrSigner as ethers.Signer;
  if ((maybeSigner as any).provider) return (maybeSigner as any).provider;
  return providerOrSigner as any;
}

async function getAllowlistContract(
  providerOrSigner: ProviderOrSigner,
  contractAddress = TRANSACTION_ALLOWLIST_ADDRESS,
) {
  const signer = await resolveSigner(providerOrSigner);
  return new ethers.Contract(
    contractAddress,
    TRANSACTION_ALLOWLIST_ABI,
    signer,
  );
}

export async function transferNativeTokens(
  providerOrSigner: ProviderOrSigner,
  to: string,
  amountWei: string | bigint = "10000000000000000000", // 10 native units (e.g., 10 SLN)
): Promise<ethers.TransactionResponse> {
  const signer = await resolveSigner(providerOrSigner);
  const tx = await signer.sendTransaction({ to, value: BigInt(amountWei) });
  return tx;
}

export async function addAdmin(
  providerOrSigner: ProviderOrSigner,
  address: string,
  contractAddress = TRANSACTION_ALLOWLIST_ADDRESS,
): Promise<RoleAssignmentResult> {
  const contract = await getAllowlistContract(
    providerOrSigner,
    contractAddress,
  );
  const roleTx = await contract.setAdmin(address);
  const transferTx = await transferNativeTokens(providerOrSigner, address);
  return { roleTx, transferTx };
}

export async function addManager(
  providerOrSigner: ProviderOrSigner,
  address: string,
  contractAddress = TRANSACTION_ALLOWLIST_ADDRESS,
): Promise<RoleAssignmentResult> {
  const contract = await getAllowlistContract(
    providerOrSigner,
    contractAddress,
  );
  const roleTx = await contract.setManager(address);
  const transferTx = await transferNativeTokens(providerOrSigner, address);
  return { roleTx, transferTx };
}

export async function addEnabled(
  providerOrSigner: ProviderOrSigner,
  address: string,
  contractAddress = TRANSACTION_ALLOWLIST_ADDRESS,
): Promise<RoleAssignmentResult> {
  const contract = await getAllowlistContract(
    providerOrSigner,
    contractAddress,
  );
  const roleTx = await contract.setEnabled(address);
  const transferTx = await transferNativeTokens(providerOrSigner, address);
  return { roleTx, transferTx };
}

export async function removeAddress(
  providerOrSigner: ProviderOrSigner,
  address: string,
  contractAddress = TRANSACTION_ALLOWLIST_ADDRESS,
): Promise<ethers.TransactionResponse> {
  const contract = await getAllowlistContract(
    providerOrSigner,
    contractAddress,
  );
  const tx = await contract.setNone(address);
  return tx;
}

export async function checkRole(
  providerOrSigner: ProviderOrSigner,
  address: string,
  contractAddress = TRANSACTION_ALLOWLIST_ADDRESS,
): Promise<number> {
  const runner = resolveReadRunner(providerOrSigner);
  const reader = new ethers.Contract(
    contractAddress,
    TRANSACTION_ALLOWLIST_ABI,
    runner,
  );
  const role = await reader.readAllowList(address);
  return Number(role);
}

export async function batchAddEnabled(
  providerOrSigner: ProviderOrSigner,
  addresses: string[],
  contractAddress = TRANSACTION_ALLOWLIST_ADDRESS,
): Promise<RoleAssignmentResult[]> {
  const results: RoleAssignmentResult[] = [];
  for (const addr of addresses) {
    try {
      const res = await addEnabled(providerOrSigner, addr, contractAddress);
      await res.roleTx.wait();
      results.push(res);
    } catch (err) {
      console.error(`Failed to add ${addr}:`, err);
    }
  }
  return results;
}

// add a main to test the addEnabled function, use RPC_URL and PRIVATE_KEY from .env to create a provider and signer
if (require.main === module) {
  (async () => {
    const rpcUrl = process.env.RPC_URL;
    const privateKey = process.env.PRIVATE_KEY;
    if (!rpcUrl || !privateKey) {
      console.error("RPC_URL and PRIVATE_KEY must be set in .env");
      process.exit(1);
    }
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);

    const testAddress = "0x2C66C4e4912C52ac968b2b5d66Cd3627Ccb2a181"; // replace with an address you want to add
    try {
      const result = await addEnabled(wallet, testAddress);
      console.log("Role assignment transaction:", result.roleTx);
      console.log("Native token transfer transaction:", result.transferTx);
    } catch (err) {
      console.error("Error adding enabled role:", err);
    }
  })();
}
