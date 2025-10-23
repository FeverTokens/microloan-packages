// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

/// @notice Interest accrual models
enum InterestType {
    DecliningBalance,
    Flat
}

/// @notice Payment profile
enum PaymentType {
    EqualPayments,
    InterestOnly
}

/// @notice Repayment frequency
enum Frequency {
    Monthly,
    Quarterly,
    Annually
}

/// @notice Lifecycle status of a loan
enum LoanStatus {
    Created,
    Funded,
    Active,
    Closed,
    Defaulted
}

/// @notice Loan creation parameters
struct LoanParams {
    InterestType interestType;
    uint16 daysInYear; // e.g., 360
    bool addFeeToPrincipal; // finance fee into principal owed
    bool feeDeductedUpfront; // withhold fee from disbursed cash
    Frequency repaymentFrequency; // Monthly (for now)
    PaymentType paymentType; // EqualPayments
    uint16 interestRateBps; // APR in basis points (e.g., 2000 = 20%)
    uint16 fileFeeBps; // e.g., 100 = 1%
    address token; // ERC20 token address
    address borrower;
    uint256 loanAmount; // face value, before financed fee
    uint256 termInMonths; // number of installments
    uint256 disbursementDate; // timestamp
    uint256 firstPaymentDate; // timestamp
}

/// @notice Core loan state tracked across packages
struct Loan {
    uint256 id;
    LoanParams params;
    address lender; // set on funding
    uint256 feeAmount; // computed at creation
    uint256 principalOwed; // scheduled principal (incl. financed fee if any)
    uint256 disbursedAmount; // cash to borrower after upfront fee withholding
    uint256 outstandingPrincipal; // evolves with repayments
    uint256 installmentAmount; // fixed installment (EqualPayments)
    uint256 remainingPeriods; // countdown
    uint256 nextDueDate; // timestamp
    uint256 totalPaid; // cumulative borrower payments
    uint256 lastPaymentDate; // timestamp
    LoanStatus status;
}

/// @title LoanRegistry Internal Interface
/// @notice Declares types and events for the loan registry package.
interface ILoanRegistryInternal {
    // ===== Events =====
    /// @notice Emitted upon loan creation
    event LoanCreated(
        uint256 indexed loanId,
        address indexed borrower,
        address token,
        uint256 principalOwed,
        uint256 disbursedAmount
    );

    /// @notice Emitted when status changes
    event StatusUpdated(
        uint256 indexed loanId,
        LoanStatus oldStatus,
        LoanStatus newStatus
    );
}
