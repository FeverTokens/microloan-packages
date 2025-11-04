// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

/// @title IMicroLoanPackageSystem
/// @notice Unified interface exposing all Microloan package functions and types on the Package System.
/// @dev This aggregates the Loan Registry, Funding, Repayment, and Token Manager interfaces.
interface IMicroLoanPackageSystem {
    // ===== Enums =====
    enum InterestType {
        DecliningBalance,
        Flat
    }

    enum PaymentType {
        EqualPayments,
        InterestOnly
    }

    enum Frequency {
        Monthly,
        Quarterly,
        Annually
    }

    enum LoanStatus {
        Created,
        Funded,
        Active,
        Closed,
        Defaulted
    }

    // ===== Structs =====
    struct LoanParams {
        InterestType interestType;
        uint16 daysInYear;
        bool addFeeToPrincipal;
        bool feeDeductedUpfront;
        Frequency repaymentFrequency;
        PaymentType paymentType;
        uint16 interestRateBps;
        uint16 fileFeeBps;
        address token;
        address borrower;
        uint256 loanAmount;
        uint256 termInMonths;
        uint256 disbursementDate;
        uint256 firstPaymentDate;
    }

    struct Loan {
        uint256 id;
        LoanParams params;
        address lender;
        uint256 feeAmount;
        uint256 principalOwed;
        uint256 disbursedAmount;
        uint256 outstandingPrincipal;
        uint256 installmentAmount;
        uint256 remainingPeriods;
        uint256 nextDueDate;
        uint256 totalPaid;
        uint256 lastPaymentDate;
        LoanStatus status;
    }

    // ===== Events (from registry) =====
    event LoanCreated(
        uint256 indexed loanId,
        address indexed borrower,
        address token,
        uint256 principalOwed,
        uint256 disbursedAmount
    );

    event StatusUpdated(
        uint256 indexed loanId,
        LoanStatus oldStatus,
        LoanStatus newStatus
    );

    // ===== Loan Registry (read/write) =====
    function createLoan(LoanParams calldata p) external returns (uint256 loanId);

    function getLoan(uint256 loanId) external view returns (Loan memory loan);

    // ===== Loan Funding =====
    function fundLoan(uint256 loanId) external;

    // ===== Loan Repayment =====
    function repayNextInstallment(uint256 loanId) external;

    // ===== Token Manager =====
    function deposit(address token, uint256 amount) external;

    function withdraw(address token, uint256 amount) external;

    function balanceOf(
        address user,
        address token
    ) external view returns (uint256);
}
