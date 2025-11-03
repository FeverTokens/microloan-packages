import hre from "hardhat";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import {
  deployContract,
  deployPackage,
  getAbi,
  getSelectors,
} from "../scripts/services/packages";

// Enums (keep in sync with ILoanRegistryInternal)
const InterestType = { DecliningBalance: 0, Flat: 1 } as const;
const PaymentType = { EqualPayments: 0, InterestOnly: 1 } as const;
const Frequency = { Monthly: 0, Quarterly: 1, Annually: 2 } as const;

describe("Microloan Lifecycle", function () {
  async function deployMicroLoanFixture() {
    const [deployer, lender, borrower, other] = await hre.ethers.getSigners();

    // Ensure artifacts and combined metadata are up to date for deploy helpers
    await hre.run("compile");
    const { generateMetadata } = await import("../scripts/generate-metadata");
    generateMetadata();

    // Deploy core diamond components
    const packageController = await deployContract(
      "PackageController",
      deployer,
    );
    const packageViewer = await deployContract("PackageViewer", deployer);

    // Deploy microloan packages as facets
    const registryCut = await deployPackage("LoanRegistry", deployer);
    console.log("LoandRegistry Cut:", registryCut);
    const fundingCut = await deployPackage("LoanFunding", deployer);
    console.log("LoanFunding Cut:", fundingCut);
    const repaymentCut = await deployPackage("LoanRepayment", deployer);
    console.log("LoanRepayment Cut:", repaymentCut);
    const tokenMgrCut = await deployPackage("LoanTokenManager", deployer);
    console.log("LoanTokenManager Cut:", tokenMgrCut);

    // Deploy diamond (constructor should add PackageController and PackageViewer facets)
    const diamond = await deployContract("MicroLoanPackageSystem", deployer, [
      packageController.target,
      packageViewer.target,
      deployer.address,
    ]);

    // Add microloan packages to the diamond
    const packageControllerAbi = getAbi("PackageController");
    const diamondWithController = new hre.ethers.Contract(
      diamond.target as string,
      packageControllerAbi,
      deployer,
    );
    await diamondWithController.diamondCut(
      [registryCut, fundingCut, repaymentCut, tokenMgrCut],
      hre.ethers.ZeroAddress,
      "0x",
    );

    // Verify viewer facet is available on diamond
    const viewerAbi = getAbi("PackageViewer");
    const viewer = new hre.ethers.Contract(
      diamond.target as string,
      viewerAbi,
      deployer,
    );
    const facetAddrs: string[] = await viewer.facetAddresses();
    expect(facetAddrs.map((a) => a.toLowerCase())).to.include(
      (packageViewer.target as string).toLowerCase(),
    );
    const viewerSelectors = getSelectors("PackageViewer");
    const actualViewerSelectors: string[] = await viewer.facetFunctionSelectors(
      packageViewer.target as string,
    );
    expect(
      actualViewerSelectors.map((s) => s.toLowerCase()),
    ).to.include.members(viewerSelectors.map((s) => s.toLowerCase()));

    // Prepare interfaces to call facets through diamond
    const registryAbi = getAbi("LoanRegistry");
    const fundingAbi = getAbi("LoanFunding");
    const repaymentAbi = getAbi("LoanRepayment");

    const registry = new hre.ethers.Contract(
      diamond.target as string,
      registryAbi,
      deployer,
    );
    const funding = new hre.ethers.Contract(
      diamond.target as string,
      fundingAbi,
      deployer,
    );
    const repayment = new hre.ethers.Contract(
      diamond.target as string,
      repaymentAbi,
      deployer,
    );

    // Stable coin for flows
    const StableCoin = await hre.ethers.getContractFactory(
      "StableCoin",
      deployer,
    );
    const stable = await StableCoin.deploy("MockUSDC", "mUSDC", 6);

    // Fund lender and borrower for test flows
    const mintAmount = hre.ethers.parseUnits("100000", 18);
    await stable.mint(lender.address, mintAmount);
    await stable.mint(borrower.address, hre.ethers.parseUnits("1000", 18));

    return {
      deployer,
      lender,
      borrower,
      other,
      stable,
      diamond,
      registry,
      funding,
      repayment,
    };
  }

  it("creates a loan and computes expected values", async function () {
    const { lender, borrower, stable, diamond, registry } = await loadFixture(
      deployMicroLoanFixture,
    );

    const now = (await hre.ethers.provider.getBlock("latest"))!.timestamp;
    const loanAmount = hre.ethers.parseUnits("3000", 18);
    const fileFeeBps = 100; // 1%
    const interestRateBps = 2000; // 20% APR
    const addFeeToPrincipal = true;
    const feeDeductedUpfront = true;

    const params = {
      interestType: InterestType.DecliningBalance,
      daysInYear: 360,
      addFeeToPrincipal,
      feeDeductedUpfront,
      repaymentFrequency: Frequency.Monthly,
      paymentType: PaymentType.EqualPayments,
      interestRateBps,
      fileFeeBps,
      token: await stable.getAddress(),
      borrower: borrower.address,
      loanAmount,
      termInMonths: 12n,
      disbursementDate: BigInt(now),
      firstPaymentDate: BigInt(now + 30 * 24 * 60 * 60),
    };

    const fee = (loanAmount * BigInt(fileFeeBps)) / 10000n;
    const expectedPrincipalOwed = addFeeToPrincipal
      ? loanAmount + fee
      : loanAmount;
    const expectedDisbursed = feeDeductedUpfront
      ? loanAmount - fee
      : loanAmount;

    // Predict loan id and create
    const predictedId = await registry
      .connect(borrower)
      .createLoan.staticCall(params);
    const tx = await registry.connect(borrower).createLoan(params);
    await tx.wait();

    // Read back the loan state
    const loan = await registry.getLoan(predictedId);
    expect(loan.id).to.equal(predictedId);
    expect(loan.params.borrower).to.equal(borrower.address);
    expect(loan.params.token).to.equal(await stable.getAddress());
    expect(loan.principalOwed).to.equal(expectedPrincipalOwed);
    expect(loan.disbursedAmount).to.equal(expectedDisbursed);
    // Status.Created = 0
    expect(loan.status).to.equal(0);

    // Sanity check schedule & installment amount
    expect(loan.installmentAmount).to.be.greaterThan(0n);
  });

  it("funds a loan and transfers disbursed amount to borrower", async function () {
    const { lender, borrower, stable, diamond, registry, funding } =
      await loadFixture(deployMicroLoanFixture);

    const now = (await hre.ethers.provider.getBlock("latest"))!.timestamp;
    const loanAmount = hre.ethers.parseUnits("3000", 18);
    const fileFeeBps = 100;
    const params = {
      interestType: 0,
      daysInYear: 360,
      addFeeToPrincipal: true,
      feeDeductedUpfront: true,
      repaymentFrequency: 0,
      paymentType: 0,
      interestRateBps: 2000,
      fileFeeBps,
      token: await stable.getAddress(),
      borrower: borrower.address,
      loanAmount,
      termInMonths: 12n,
      disbursementDate: BigInt(now),
      firstPaymentDate: BigInt(now + 30 * 24 * 60 * 60),
    };

    const loanId = await registry
      .connect(borrower)
      .createLoan.staticCall(params);
    await (await registry.connect(borrower).createLoan(params)).wait();

    const created = await registry.getLoan(loanId);
    const disbursed = created.disbursedAmount;

    // Lender approves control to move funds and funds loan
    await (
      await stable.connect(lender).approve(diamond.target as string, disbursed)
    ).wait();

    const beforeBorrowerBal = await stable.balanceOf(borrower.address);
    await (await funding.connect(lender).fundLoan(loanId)).wait();
    const afterBorrowerBal = await stable.balanceOf(borrower.address);

    // Status.Funded = 1
    const funded = await registry.getLoan(loanId);
    expect(funded.status).to.equal(1);
    expect(funded.lender).to.equal(lender.address);
    expect(afterBorrowerBal - beforeBorrowerBal).to.equal(disbursed);
  });

  it("repays installments and closes the loan", async function () {
    const { lender, borrower, stable, diamond, registry, funding, repayment } =
      await loadFixture(deployMicroLoanFixture);

    const now = (await hre.ethers.provider.getBlock("latest"))!.timestamp;
    const loanAmount = hre.ethers.parseUnits("3000", 18);
    const params = {
      interestType: 0,
      daysInYear: 360,
      addFeeToPrincipal: true,
      feeDeductedUpfront: false,
      repaymentFrequency: 0,
      paymentType: 0,
      interestRateBps: 2000,
      fileFeeBps: 100,
      token: await stable.getAddress(),
      borrower: borrower.address,
      loanAmount,
      termInMonths: 12n,
      disbursementDate: BigInt(now),
      firstPaymentDate: BigInt(now + 30 * 24 * 60 * 60),
    };

    const loanId = await registry
      .connect(borrower)
      .createLoan.staticCall(params);
    await (await registry.connect(borrower).createLoan(params)).wait();
    const created = await registry.getLoan(loanId);

    // Lender funds loan
    await (
      await stable
        .connect(lender)
        .approve(diamond.target as string, created.disbursedAmount)
    ).wait();
    await (await funding.connect(lender).fundLoan(loanId)).wait();

    // Borrower approves repayments (approve more than needed for safety)
    const approveAmount = hre.ethers.parseUnits("1000000", 18);
    await (
      await stable
        .connect(borrower)
        .approve(diamond.target as string, approveAmount)
    ).wait();

    // Ensure borrower has enough tokens to repay all installments
    // Top up if needed beyond disbursed amount
    await (
      await stable.mint(borrower.address, hre.ethers.parseUnits("100000", 18))
    ).wait();

    // Repay first installment
    const before = await registry.getLoan(loanId);
    await (
      await repayment.connect(borrower).repayNextInstallment(loanId)
    ).wait();
    const after = await registry.getLoan(loanId);

    // Status becomes Active (2), remainingPeriods decremented, outstanding reduced
    expect(after.status).to.equal(2);
    expect(after.remainingPeriods).to.equal(before.remainingPeriods - 1n);
    expect(after.outstandingPrincipal).to.be.lessThan(
      before.outstandingPrincipal,
    );

    // Repay remaining until closed (cap iterations for safety)
    let loops = 0;
    while (true) {
      const state = await registry.getLoan(loanId);
      if (
        state.status === 3 ||
        state.remainingPeriods === 0n ||
        state.outstandingPrincipal === 0n
      ) {
        break;
      }
      await (
        await repayment.connect(borrower).repayNextInstallment(loanId)
      ).wait();
      loops += 1;
      if (loops > 24) break; // safety cap
    }

    const closed = await registry.getLoan(loanId);
    expect(closed.status).to.equal(3); // Closed
    expect(closed.outstandingPrincipal).to.equal(0n);
    expect(closed.remainingPeriods).to.equal(0n);
  });
});
