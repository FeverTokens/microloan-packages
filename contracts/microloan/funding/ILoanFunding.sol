// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {ILoanFundingInternal} from "./ILoanFundingInternal.sol";

/// @title LoanFunding External Interface
/// @notice External entry points for loan funding.
interface ILoanFunding is ILoanFundingInternal {
    /// @notice Fund the specified loan by transferring cash to borrower and marking status
    /// @param loanId Loan identifier
    function fundLoan(uint256 loanId) external;
}

