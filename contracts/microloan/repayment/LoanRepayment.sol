// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {ILoanRepayment} from "./ILoanRepayment.sol";
import {LoanRepaymentInternal} from "./LoanRepaymentInternal.sol";

/// @title LoanRepayment
/// @notice External wrapper for processing installment repayments.
contract LoanRepayment is ILoanRepayment, LoanRepaymentInternal {
    /// @inheritdoc ILoanRepayment
    function repayNextInstallment(uint256 loanId) external override {
        _repayNextInstallment(loanId);
    }
}

