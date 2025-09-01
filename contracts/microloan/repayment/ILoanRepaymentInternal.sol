// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

/// @title LoanRepayment Internal Interface
/// @notice Events for installment repayments and closure.
interface ILoanRepaymentInternal {
    /// @notice Emitted after an installment repayment
    event LoanInstallmentRepaid(
        uint256 indexed loanId,
        address indexed payer,
        uint256 interestPaid,
        uint256 principalPaid,
        uint256 remainingPrincipal
    );

    /// @notice Emitted when a loan is fully closed
    event LoanClosed(uint256 indexed loanId);
}

