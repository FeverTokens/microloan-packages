# Microloan Protocol

## Overview

Modular microloan functionality with declining‑balance interest, monthly repayments, configurable fees, and amortization schedules. Built using a package‑oriented design on the Diamond (EIP‑2535) architecture for clean separations and safe upgrades.

## What You Get

- Declining‑balance interest with equal‑payment schedules
- Monthly installments and due‑date tracking
- Configurable fees (upfront or capitalized)
- Tight integration with registry, funding, and repayment flows
- Upgradeable, auditable package boundaries

## Architecture at a Glance

- Diamond (EIP‑2535): Modular facets behind a single proxy
- Separation of Concerns: Interfaces, logic, and storage decoupled
- Namespaced Storage: ERC‑7201‑style slots via a `Layout` struct

### Standard Package Layout (5 files)

- `IMyPackageInternal.sol`: Enums, structs, events, errors (no business logic)
- `IMyPackage.sol`: External interface (public entry points)
- `MyPackageStorage.sol`: `Layout` struct + dedicated storage slot and `layout()` accessor
- `MyPackageInternal.sol`: Internal logic using `Layout`
- `MyPackage.sol`: External wrapper implementing `IMyPackage` and delegating to internal logic

## Microloan Domain Model

The microloan module extends a lending baseline by adding terms, flow control, and policies specific to amortized microloans.

### Reused Base Packages (Lending)

- LoanRegistry: Core state, lifecycle, Loan struct, LoanStatus, LoanCreated/LoanUpdated
- LoanFunding: Validates and executes funding, emits LoanFunded
- LoanRepayment: Accepts repayments, updates status, emits LoanRepaid/LoanDefaulted
- LoanTokenManager: Deposits/withdrawals and internal ERC‑20 balances

### New Microloan Packages

- MicroLoanTerms

  - Role: Defines MicroLoanParameters, computes fees and amortization schedule
  - Data: MicroLoanParameters, Installment, InterestType (DecliningBalance default)
  - Event: ScheduleGenerated
  - Functions: computeSchedule(params) → Installment[], calculatePayment(...), feeAmount(...)

- MicroLoanControl

  - Role: Validations and orchestration across registry/funding/repayment
  - Events: MicroLoanCreated, MicroLoanFunded, MicroLoanInstallmentRepaid
  - Functions: createMicroLoan(params, token), fundMicroLoan(loanId, token), repayInstallment(loanId, token), getSchedule(loanId)

- MicroLoanFlow

  - Role: High‑level lifecycle wiring (create → fund → repay) and state transitions

- MicroLoanPolicy
  - Role: Roles and conditions (borrower/lender, due dates, default)
  - Examples: CreateMicroLoanPolicy (borrower has no active loan), FundMicroLoanPolicy (status Created), RepayInstallmentPolicy (on‑time), DefaultDetectionCondition (dueDate + grace)

## Flows

- createMicroLoan

  - Validates borrower and parameters, computes schedule, registers in registry, emits MicroLoanCreated

- fundMicroLoan

  - Ensures status is Created, transfers principal, marks funded, emits MicroLoanFunded

- repayInstallment

  - Determines next due installment amount, transfers funds, updates schedule/status, emits MicroLoanInstallmentRepaid; handles default windows

- getSchedule
  - Returns Installment[] including payment status for off‑chain use and UI

## Parameters (Essentials)

- InterestType: DecliningBalance (default)
- Day Count: Days‑in‑year and days‑in‑month affect accruals
- Fees: Upfront vs capitalized into principal
- Frequency: Monthly, equal payments
- Inputs: principal, annualRate, term, disbursementDate, firstPaymentDate

## Quick Start

- Prerequisites: Node.js 18+, npm, Hardhat

```bash
npm install
npm run compile   # compile and generate metadata/combined.json
npm test
```

## Build, Lint, Metadata

```bash
npm run compile    # hardhat compile + metadata
npm run metadata   # regenerate metadata from artifacts
npm run lint       # check formatting
npm run lint:fix   # write formatting
```

## Deployment

### Quick Deploy with SDK

Deploy using the Fever SDK with manifest-driven configuration:

```bash
# Compile contracts first
npm run compile

# Run SDK deployment
npm run deploy:sdk
```

This uses `scripts/deploy-with-sdk.ts` which:
- Loads artifacts from `metadata/combined.json`
- Reads YAML manifest from `f9s/microloan-package-system.yaml`
- Deploys packages and system with environment-based configuration
- Supports external dependencies with pre-configured addresses

### Manual Deployment

- Helpers live in `scripts/services/packages.ts` (`deployContract`, `deployPackage`).
- `scripts/deploy-erc3643.ts` demonstrates wiring of base contracts and the diamond. Follow its pattern to add microloan packages.

Run locally:

```bash
npm run deploy:erc3643
```

### External Dependencies Configuration

For external dependencies (contracts deployed separately), configure addresses in the manifest:

**1. Update `.env` with dependency addresses:**
```env
PACKAGE_VIEWER_ADDRESS=0x1111111111111111111111111111111111111111
PACKAGE_CONTROLLER_ADDRESS=0x2222222222222222222222222222222222222222
```

**2. Reference in manifest (`f9s/microloan-package-system.yaml`):**
```yaml
spec:
  dependencies:
    packageViewer:
      name: PackageViewer
      address: "${PACKAGE_VIEWER_ADDRESS}"
    packageController:
      name: PackageController
      address: "${PACKAGE_CONTROLLER_ADDRESS}"
```

When `address` is provided, the deployment will use that address directly. If not provided, it will attempt to deploy from artifacts. If neither address nor artifact exists, deployment will fail with a helpful error message.

## Project Layout

- `contracts/`: Solidity packages and facets (ERC‑3643 base + microloan additions)
- `scripts/`: Deployment, metadata generation, and helpers
- `metadata/combined.json`: ABI/bytecode bundle generated from artifacts
- `test/`: Hardhat tests (extend with microloan scenarios)

## License

MIT
