// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

/// @title LoanFunding Internal Interface
/// @notice Events and errors for funding operations.
interface ILoanFundingInternal {
    /// @notice Emitted when a loan is funded
    event LoanFunded(
        uint256 indexed loanId,
        address indexed lender,
        uint256 amount
    );
}
