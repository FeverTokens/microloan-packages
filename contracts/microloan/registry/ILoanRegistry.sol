// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {ILoanRegistryInternal} from "./ILoanRegistryInternal.sol";

/// @title LoanRegistry External Interface
/// @notice External entry points for managing loans in the registry.
interface ILoanRegistry is ILoanRegistryInternal {
    /// @notice Create a new loan record with the given parameters
    /// @param p Loan parameters
    /// @return loanId Newly assigned loan identifier
    function createLoan(LoanParams calldata p) external returns (uint256 loanId);

    /// @notice Query the on-chain loan state
    /// @param loanId Loan identifier
    /// @return loan The Loan struct
    function getLoan(uint256 loanId) external view returns (Loan memory loan);
}

