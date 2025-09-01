import { BrowserProvider, Contract, JsonRpcProvider, Signer, parseUnits, MaxUint256 } from 'ethers';

// Minimal ABIs for required facets and ERC20 metadata
const LoanRegistryABI = [
  // createLoan(LoanParams)
  'function createLoan((uint8,uint16,bool,bool,uint8,uint8,uint16,uint16,address,address,uint256,uint256,uint256,uint256)) returns (uint256)',
  // getLoan(uint256) returns Loan with named fields for easier access
  'function getLoan(uint256) view returns (tuple(uint256 id, tuple(uint8 interestType, uint16 daysInYear, bool addFeeToPrincipal, bool feeDeductedUpfront, uint8 repaymentFrequency, uint8 paymentType, uint16 interestRateBps, uint16 fileFeeBps, address token, address borrower, uint256 loanAmount, uint256 termInMonths, uint256 disbursementDate, uint256 firstPaymentDate) params, address lender, uint256 feeAmount, uint256 principalOwed, uint256 disbursedAmount, uint256 outstandingPrincipal, uint256 installmentAmount, uint256 remainingPeriods, uint256 nextDueDate, uint256 totalPaid, uint256 lastPaymentDate, uint8 status))'
];

const LoanFundingABI = [
  'function fundLoan(uint256 loanId)'
];

const LoanRepaymentABI = [
  'function repayNextInstallment(uint256 loanId)'
];

const ERC20MetadataABI = [
  'function decimals() view returns (uint8)',
  'function approve(address spender, uint256 value) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)'
];

// Input type for createLoan
export interface CreateLoanInput {
  rate: number; // percent APR (e.g., 20)
  amount: number | string; // token units before decimals (e.g., 3000)
  daysInYear: number | string; // e.g., '360'
  termMonths: number; // e.g., 12
  fileFeesPct: number; // percent (e.g., 1)
  paymentType: 'Equal Payments' | 'Interest Only' | string;
  interestType: 'Declining Balance' | 'Flat' | string;
  disbursementDate: string; // 'YYYY-MM-DD'
  firstPaymentDate: string; // 'YYYY-MM-DD'
  addFeeToPrincipal: boolean;
  feeDeductedUpfront: boolean;
  repaymentFrequency: 'Monthly' | 'Quarterly' | 'Annually' | string;
}

type EthersProviderLike = BrowserProvider | JsonRpcProvider;

async function getSigner(providerOrSigner: EthersProviderLike | Signer): Promise<Signer> {
  if ((providerOrSigner as Signer).provider !== undefined && typeof (providerOrSigner as any).getAddress === 'function') {
    return providerOrSigner as Signer;
  }
  const prov = providerOrSigner as any;
  if (typeof prov.getSigner === 'function') {
    const signer = await prov.getSigner();
    return signer as Signer;
  }
  throw new Error('A Signer or compatible Provider is required');
}

function toBps(percent: number): number {
  return Math.round(percent * 100);
}

function parseDateToTimestamp(dateStr: string): bigint {
  // Accepts 'YYYY-MM-DD' or ISO strings
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) throw new Error(`Invalid date: ${dateStr}`);
  return BigInt(Math.floor(d.getTime() / 1000));
}

function mapInterestType(v: string): number {
  const key = v.trim().toLowerCase();
  if (key.startsWith('declining')) return 0; // DecliningBalance
  if (key.startsWith('flat')) return 1; // Flat
  throw new Error(`Unknown interestType: ${v}`);
}

function mapPaymentType(v: string): number {
  const key = v.trim().toLowerCase();
  if (key.startsWith('equal')) return 0; // EqualPayments
  if (key.startsWith('interest')) return 1; // InterestOnly
  throw new Error(`Unknown paymentType: ${v}`);
}

function mapFrequency(v: string): number {
  const key = v.trim().toLowerCase();
  if (key.startsWith('month')) return 0; // Monthly
  if (key.startsWith('quart')) return 1; // Quarterly
  if (key.startsWith('ann')) return 2; // Annually
  throw new Error(`Unknown repaymentFrequency: ${v}`);
}

export async function createLoan(
  providerOrSigner: EthersProviderLike | Signer,
  diamondAddress: string,
  tokenAddress: string,
  input: CreateLoanInput
): Promise<{ loanId: bigint; txHash: string }>
{
  const signer = await getSigner(providerOrSigner);
  const borrower = await signer.getAddress();

  // Resolve token decimals and compute amount
  const erc20 = new Contract(tokenAddress, ERC20MetadataABI, signer);
  const decimals: number = await erc20.decimals();
  const loanAmount = parseUnits(String(input.amount), decimals);

  const interestType = mapInterestType(input.interestType);
  const paymentType = mapPaymentType(input.paymentType);
  const repaymentFrequency = mapFrequency(input.repaymentFrequency);
  const interestRateBps = toBps(Number(input.rate));
  const fileFeeBps = toBps(Number(input.fileFeesPct));
  const daysInYear = Number(input.daysInYear);
  const termInMonths = BigInt(input.termMonths);
  const disbursementDate = parseDateToTimestamp(input.disbursementDate);
  const firstPaymentDate = parseDateToTimestamp(input.firstPaymentDate);

  const registry = new Contract(diamondAddress, LoanRegistryABI, signer);

  const paramsTuple: any[] = [
    interestType,
    daysInYear,
    Boolean(input.addFeeToPrincipal),
    Boolean(input.feeDeductedUpfront),
    repaymentFrequency,
    paymentType,
    interestRateBps,
    fileFeeBps,
    tokenAddress,
    borrower,
    loanAmount,
    termInMonths,
    disbursementDate,
    firstPaymentDate,
  ];

  // Predict ID then send tx
  const predictedId: bigint = await (registry as any).createLoan.staticCall(paramsTuple);
  const tx = await (registry as any).createLoan(paramsTuple);
  const receipt = await tx.wait();

  return { loanId: predictedId, txHash: receipt.hash };
}

// Explicit approval handler for ERC20 spending by the diamond
export async function approveDiamondSpend(
  providerOrSigner: EthersProviderLike | Signer,
  tokenAddress: string,
  diamondAddress: string,
  amount: number | string | bigint,
  approveMax = false
): Promise<{ txHash: string; amount: bigint }>
{
  const signer = await getSigner(providerOrSigner);
  const erc20 = new Contract(tokenAddress, ERC20MetadataABI, signer);

  let value: bigint;
  if (approveMax) {
    value = MaxUint256;
  } else if (typeof amount === 'bigint') {
    value = amount;
  } else {
    const decimals: number = await erc20.decimals();
    value = parseUnits(String(amount), decimals);
  }

  const tx = await erc20.approve(diamondAddress, value);
  const receipt = await tx.wait();
  return { txHash: receipt.hash, amount: value };
}

export async function fundLoan(
  providerOrSigner: EthersProviderLike | Signer,
  diamondAddress: string,
  loanId: bigint | number
): Promise<{ txHash: string }>
{
  const signer = await getSigner(providerOrSigner);
  const lender = await signer.getAddress();

  const registry = new Contract(diamondAddress, LoanRegistryABI, signer);
  const loan = await (registry as any).getLoan(loanId);

  // loan.params.token and loan.disbursedAmount are named in ABI above
  const tokenAddress: string = loan.params.token as string;
  const disbursedAmount: bigint = loan.disbursedAmount as bigint;

  // Ensure allowance is sufficient
  const erc20 = new Contract(tokenAddress, ERC20MetadataABI, signer);
  const currentAllowance: bigint = await erc20.allowance(lender, diamondAddress);
  if (currentAllowance < disbursedAmount) {
    const approveTx = await erc20.approve(diamondAddress, disbursedAmount);
    await approveTx.wait();
  }

  const funding = new Contract(diamondAddress, LoanFundingABI, signer);
  const tx = await (funding as any).fundLoan(loanId);
  const receipt = await tx.wait();
  return { txHash: receipt.hash };
}

export async function repayNextInstallment(
  providerOrSigner: EthersProviderLike | Signer,
  diamondAddress: string,
  loanId: bigint | number,
  approveMax = false
): Promise<{ txHash: string }>
{
  const signer = await getSigner(providerOrSigner);
  const borrower = await signer.getAddress();

  const registry = new Contract(diamondAddress, LoanRegistryABI, signer);
  const loan = await (registry as any).getLoan(loanId);
  const tokenAddress: string = loan.params.token as string;
  const installmentAmount: bigint = loan.installmentAmount as bigint;

  const erc20 = new Contract(tokenAddress, ERC20MetadataABI, signer);
  const needed = approveMax ? MaxUint256 : installmentAmount;
  const allowance: bigint = await erc20.allowance(borrower, diamondAddress);
  if (allowance < needed) {
    const approveTx = await erc20.approve(diamondAddress, needed);
    await approveTx.wait();
  }

  const repayment = new Contract(diamondAddress, LoanRepaymentABI, signer);
  const tx = await (repayment as any).repayNextInstallment(loanId);
  const receipt = await tx.wait();
  return { txHash: receipt.hash };
}

// Optional utility to fetch loan details (view)
export async function getLoan(
  provider: EthersProviderLike,
  diamondAddress: string,
  loanId: bigint | number
) {
  const registry = new Contract(diamondAddress, LoanRegistryABI, provider as any);
  return (registry as any).getLoan(loanId);
}
