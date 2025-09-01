// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {ILoanRepaymentInternal} from "./ILoanRepaymentInternal.sol";

/// @title LoanRepayment External Interface
/// @notice Exposes function to repay the next installment.
interface ILoanRepayment is ILoanRepaymentInternal {
    /// @notice Repay the next due installment for the given loan
    /// @param loanId Loan identifier
    function repayNextInstallment(uint256 loanId) external;
}

