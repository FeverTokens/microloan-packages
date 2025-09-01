"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const ethers_1 = require("ethers");
const hardhat_1 = __importDefault(require("hardhat"));
const handlers_1 = require("../src/handlers");
dotenv_1.default.config();
const ERC20_ABI = [
    "function decimals() view returns (uint8)",
    "function mint(address to, uint256 amount)",
    "function balanceOf(address account) view returns (uint256)",
];
async function main() {
    var _a;
    const rpcUrl = process.env.RPC_URL;
    const chainIdEnv = process.env.CHAIN_ID;
    const lenderPk = process.env.DEPLOYER_PRIVATE_KEY || process.env.PRIVATE_KEY;
    const borrowerPk = process.env.DEALER_PRIVATE_KEY; // explicitly required by request
    const diamondAddress = process.env.MICROLOAN_DIAMOND_ADDRESS;
    const existingStable = process.env.STABLECOIN_ADDRESS; // optional
    if (!rpcUrl)
        throw new Error("RPC_URL is not set in .env");
    if (!chainIdEnv)
        throw new Error("CHAIN_ID is not set in .env");
    if (!lenderPk)
        throw new Error("DEPLOYER_PRIVATE_KEY or PRIVATE_KEY is not set in .env");
    if (!borrowerPk)
        throw new Error("DEALER_PRIVATE_KEY is not set in .env");
    if (!diamondAddress)
        throw new Error("MICROLOAN_DIAMOND_ADDRESS is not set in .env");
    const chainId = parseInt(chainIdEnv, 10);
    const provider = new ethers_1.JsonRpcProvider(rpcUrl, chainId);
    const lender = new ethers_1.Wallet(lenderPk.startsWith("0x") ? lenderPk : `0x${lenderPk}`, provider);
    const borrower = new ethers_1.Wallet(borrowerPk.startsWith("0x") ? borrowerPk : `0x${borrowerPk}`, provider);
    console.log("Network RPC:", rpcUrl);
    console.log("Chain ID   :", chainId);
    console.log("Lender     :", lender.address);
    console.log("Borrower   :", borrower.address);
    console.log("Diamond    :", diamondAddress);
    // Ensure borrower has native gas for txs; optionally top up from lender
    const AUTO_TOPUP_NATIVE = ((_a = process.env.AUTO_TOPUP_NATIVE) !== null && _a !== void 0 ? _a : "true").toLowerCase() !== "false";
    const TOPUP_AMOUNT = (0, ethers_1.parseEther)(process.env.NATIVE_TOPUP_AMOUNT || "0.05");
    const MIN_BALANCE = (0, ethers_1.parseEther)(process.env.NATIVE_MIN_BALANCE || "0.005");
    const lenderNative = await provider.getBalance(lender.address);
    const borrowerNative = await provider.getBalance(borrower.address);
    console.log("Lender native balance  :", (0, ethers_1.formatEther)(lenderNative));
    console.log("Borrower native balance:", (0, ethers_1.formatEther)(borrowerNative));
    if (AUTO_TOPUP_NATIVE &&
        borrowerNative < MIN_BALANCE &&
        lenderNative > TOPUP_AMOUNT + MIN_BALANCE) {
        console.log(`Borrower balance below minimum. Topping up ${(0, ethers_1.formatEther)(TOPUP_AMOUNT)} native from lender...`);
        const tx = await lender.sendTransaction({
            to: borrower.address,
            value: TOPUP_AMOUNT,
        });
        await tx.wait();
        const newBal = await provider.getBalance(borrower.address);
        console.log("Borrower new native balance:", (0, ethers_1.formatEther)(newBal));
    }
    else if (borrowerNative < MIN_BALANCE) {
        console.warn("Borrower has insufficient native gas. Fund borrower or set AUTO_TOPUP_NATIVE=true with sufficient lender balance.");
    }
    // Determine or deploy stablecoin
    let tokenAddress = existingStable;
    let token = null;
    let deployedStable = false;
    if (!tokenAddress) {
        console.log("No STABLECOIN_ADDRESS provided. Deploying MockUSDC...");
        const StableCoin = await hardhat_1.default.ethers.getContractFactory("StableCoin", lender);
        token = await StableCoin.deploy("MockUSDC", "mUSDC", 6);
        await token.waitForDeployment();
        tokenAddress = await token.getAddress();
        deployedStable = true;
        console.log("StableCoin deployed at:", tokenAddress);
    }
    else {
        token = new ethers_1.Contract(tokenAddress, ERC20_ABI, lender);
        console.log("Using existing stablecoin at:", tokenAddress);
    }
    // Loan input
    const input = {
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
    const { loanId, txHash: createHash } = await (0, handlers_1.createLoan)(borrower, diamondAddress, tokenAddress, input);
    console.log("createLoan tx:", createHash);
    console.log("Predicted Loan ID:", loanId.toString());
    // Read back the loan to know amounts
    const loanState = await (0, handlers_1.getLoan)(provider, diamondAddress, loanId);
    const disbursed = loanState.disbursedAmount;
    const installment = loanState.installmentAmount;
    console.log("Disbursed amount (raw):", disbursed.toString());
    console.log("Installment amount (raw):", installment.toString());
    // If using an existing stablecoin, verify balances are sufficient and warn if not
    if (token) {
        try {
            const [lBal, bBal] = await Promise.all([
                token.connect(lender).balanceOf(lender.address),
                token.connect(lender).balanceOf(borrower.address),
            ]);
            if (lBal < disbursed) {
                console.warn("Lender stablecoin balance is insufficient to fund the loan. Please transfer tokens to the lender.");
            }
            if (bBal < installment) {
                console.warn("Borrower stablecoin balance may be insufficient to repay an installment. Consider topping up.");
            }
        }
        catch (_b) { }
    }
    // Ensure lender has enough tokens to fund
    if (deployedStable && token) {
        console.log("Minting tokens to lender and borrower for flow...");
        await (await token.connect(lender).mint(lender.address, disbursed)).wait();
        // Top up borrower to ensure at least one installment
        const mintBorrower = installment * 2n;
        await (await token.connect(lender).mint(borrower.address, mintBorrower)).wait();
    }
    // Fund the loan as the lender
    console.log("\nApproving lender allowance...");
    await (0, handlers_1.approveDiamondSpend)(lender, tokenAddress, diamondAddress, disbursed);
    console.log("\nFunding loan...");
    const { txHash: fundHash } = await (0, handlers_1.fundLoan)(lender, diamondAddress, loanId);
    console.log("fundLoan tx:", fundHash);
    // Repay next installment as the borrower
    console.log("\nApproving borrower allowance...");
    await (0, handlers_1.approveDiamondSpend)(borrower, tokenAddress, diamondAddress, installment);
    console.log("Repaying next installment...");
    const { txHash: repayHash } = await (0, handlers_1.repayNextInstallment)(borrower, diamondAddress, loanId);
    console.log("repayNextInstallment tx:", repayHash);
    console.log("\nDone.");
}
main().catch((err) => {
    console.error(err);
    process.exit(1);
});
