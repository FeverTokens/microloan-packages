// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {ILoanFunding} from "./ILoanFunding.sol";
import {LoanFundingInternal} from "./LoanFundingInternal.sol";

/// @title LoanFunding
/// @notice External wrapper for loan funding.
contract LoanFunding is ILoanFunding, LoanFundingInternal {
    /// @inheritdoc ILoanFunding
    function fundLoan(uint256 loanId) external override {
        _fundLoan(loanId);
    }
}

