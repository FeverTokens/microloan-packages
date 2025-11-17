import dotenv from "dotenv";
import {
  JsonRpcProvider,
  Wallet,
  Contract,
  parseEther,
  formatEther,
  Interface,
  BaseContract,
} from "ethers";
import hre from "hardhat";
import "@nomicfoundation/hardhat-ethers";
import {
  createLoan,
  fundLoan,
  repayNextInstallment,
  getLoan,
  CreateLoanInput,
  approveDiamondSpend,
} from "../src/handlers";

dotenv.config();

const ERC20_ABI = [
  "function decimals() view returns (uint8)",
  "function mint(address to, uint256 amount)",
  "function balanceOf(address account) view returns (uint256)",
];

// Create interface for type safety
const ERC20_INTERFACE = new Interface(ERC20_ABI);

// Define ERC20 methods interface for better typing
interface ERC20Methods {
  balanceOf(account: string): Promise<bigint>;
  mint(to: string, amount: bigint): Promise<any>;
  decimals(): Promise<number>;
  connect(signer: Wallet): Contract & ERC20Methods;
}

// Helper function to create typed ERC20 contract
function createERC20Contract(address: string, signer: Wallet): Contract & ERC20Methods {
  return new Contract(address, ERC20_ABI, signer) as Contract & ERC20Methods;
}

// Helper function to validate ERC20 interface
function assertIsERC20(contract: Contract | any): asserts contract is Contract & ERC20Methods {
  // Basic validation that contract has required ERC20 methods
  if (!contract || typeof contract.balanceOf !== 'function' || typeof contract.mint !== 'function') {
    throw new Error('Contract does not implement ERC20 interface');
  }
}

async function main() {
  const rpcUrl = process.env.RPC_URL;
  const chainIdEnv = process.env.CHAIN_ID;
  const lenderPk = process.env.DEPLOYER_PRIVATE_KEY || process.env.PRIVATE_KEY;
  const borrowerPk = process.env.DEALER_PRIVATE_KEY; // explicitly required by request
  const diamondAddress = process.env.MICROLOAN_DIAMOND_ADDRESS;
  const existingStable = process.env.STABLECOIN_ADDRESS; // optional

  if (!rpcUrl) throw new Error("RPC_URL is not set in .env");
  if (!chainIdEnv) throw new Error("CHAIN_ID is not set in .env");
  if (!lenderPk)
    throw new Error("DEPLOYER_PRIVATE_KEY or PRIVATE_KEY is not set in .env");
  if (!borrowerPk) throw new Error("DEALER_PRIVATE_KEY is not set in .env");
  if (!diamondAddress)
    throw new Error("MICROLOAN_DIAMOND_ADDRESS is not set in .env");

  const chainId = parseInt(chainIdEnv, 10);
  const provider = new JsonRpcProvider(rpcUrl, chainId);

  const lender = new Wallet(
    lenderPk.startsWith("0x") ? lenderPk : `0x${lenderPk}`,
    provider,
  );
  const borrower = new Wallet(
    borrowerPk.startsWith("0x") ? borrowerPk : `0x${borrowerPk}`,
    provider,
  );

  console.log("Network RPC:", rpcUrl);
  console.log("Chain ID   :", chainId);
  console.log("Lender     :", lender.address);
  console.log("Borrower   :", borrower.address);
  console.log("Diamond    :", diamondAddress);

  // Ensure borrower has native gas for txs; optionally top up from lender
  const AUTO_TOPUP_NATIVE =
    (process.env.AUTO_TOPUP_NATIVE ?? "true").toLowerCase() !== "false";
  const TOPUP_AMOUNT = parseEther(process.env.NATIVE_TOPUP_AMOUNT || "0.05");
  const MIN_BALANCE = parseEther(process.env.NATIVE_MIN_BALANCE || "0.005");

  const lenderNative = await provider.getBalance(lender.address);
  const borrowerNative = await provider.getBalance(borrower.address);
  console.log("Lender native balance  :", formatEther(lenderNative));
  console.log("Borrower native balance:", formatEther(borrowerNative));

  if (
    AUTO_TOPUP_NATIVE &&
    borrowerNative < MIN_BALANCE &&
    lenderNative > TOPUP_AMOUNT + MIN_BALANCE
  ) {
    console.log(
      `Borrower balance below minimum. Topping up ${formatEther(TOPUP_AMOUNT)} native from lender...`,
    );
    const tx = await lender.sendTransaction({
      to: borrower.address,
      value: TOPUP_AMOUNT,
    });
    await tx.wait();
    const newBal = await provider.getBalance(borrower.address);
    console.log("Borrower new native balance:", formatEther(newBal));
  } else if (borrowerNative < MIN_BALANCE) {
    console.warn(
      "Borrower has insufficient native gas. Fund borrower or set AUTO_TOPUP_NATIVE=true with sufficient lender balance.",
    );
  }

  // Determine or deploy stablecoin
  let tokenAddress = existingStable;
  let token: (Contract & ERC20Methods) | null = null;
  let deployedStable = false;

  if (!tokenAddress) {
    console.log("No STABLECOIN_ADDRESS provided. Deploying MockUSDC...");
    const StableCoin = await hre.ethers.getContractFactory(
      "StableCoin",
      lender,
    );
    const deployedToken = await StableCoin.deploy("MockUSDC", "mUSDC", 6);
    await deployedToken.waitForDeployment();
    tokenAddress = await deployedToken.getAddress();
    // Validate deployed contract implements ERC20 interface before type assertion
    assertIsERC20(deployedToken);
    token = deployedToken as Contract & ERC20Methods;
    deployedStable = true;
    console.log("StableCoin deployed at:", tokenAddress);
  } else {
    token = createERC20Contract(tokenAddress, lender);
    console.log("Using existing stablecoin at:", tokenAddress);
  }

  // Loan input
  const input: CreateLoanInput = {
    rate: 20,
    amount: 3000,
    daysInYear: "360",
    termMonths: 12,
    fileFeesPct: 1,
    paymentType: "Equal Payments",
    interestType: "Declining Balance",
    disbursementDate: "2025-08-29",
    firstPaymentDate: "2025-10-03",
    addFeeToPrincipal: true,
    feeDeductedUpfront: true,
    repaymentFrequency: "Monthly",
  };

  // Create the loan as the borrower
  console.log("\nCreating loan...");
  const { loanId, txHash: createHash } = await createLoan(
    borrower,
    diamondAddress,
    tokenAddress!,
    input,
  );
  console.log("createLoan tx:", createHash);
  console.log("Predicted Loan ID:", loanId.toString());

  // Read back the loan to know amounts
  const loanState = await getLoan(provider, diamondAddress, loanId);
  const disbursed: bigint = loanState.disbursedAmount;
  const installment: bigint = loanState.installmentAmount;
  console.log("Disbursed amount (raw):", disbursed.toString());
  console.log("Installment amount (raw):", installment.toString());

  // If using an existing stablecoin, verify balances are sufficient and warn if not
  if (token) {
    try {
      const connectedToken = token.connect(lender) as Contract & ERC20Methods;
      const [lBal, bBal] = await Promise.all([
        connectedToken.balanceOf(lender.address),
        connectedToken.balanceOf(borrower.address),
      ]);
      if (lBal < disbursed) {
        console.warn(
          "Lender stablecoin balance is insufficient to fund the loan. Please transfer tokens to the lender.",
        );
      }
      if (bBal < installment) {
        console.warn(
          "Borrower stablecoin balance may be insufficient to repay an installment. Consider topping up.",
        );
      }
    } catch {}
  }

  // Ensure lender has enough tokens to fund
  if (deployedStable && token) {
    console.log("Minting tokens to lender and borrower for flow...");
    const connectedToken = token.connect(lender) as Contract & ERC20Methods;
    await (await connectedToken.mint(lender.address, disbursed)).wait();
    // Top up borrower to ensure at least one installment
    const mintBorrower = installment * 2n;
    await (
      await connectedToken.mint(borrower.address, mintBorrower)
    ).wait();
  }

  // Fund the loan as the lender
  console.log("\nApproving lender allowance...");
  await approveDiamondSpend(lender, tokenAddress!, diamondAddress, disbursed);
  console.log("\nFunding loan...");
  const { txHash: fundHash } = await fundLoan(lender, diamondAddress, loanId);
  console.log("fundLoan tx:", fundHash);

  // Repay next installment as the borrower
  console.log("\nApproving borrower allowance...");
  await approveDiamondSpend(borrower, tokenAddress!, diamondAddress, installment);
  console.log("Repaying next installment...");
  const { txHash: repayHash } = await repayNextInstallment(
    borrower,
    diamondAddress,
    loanId,
  );
  console.log("repayNextInstallment tx:", repayHash);

  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
