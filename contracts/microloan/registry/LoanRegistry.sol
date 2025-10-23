// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "./ILoanRegistry.sol";
import "./LoanRegistryInternal.sol";

/// @title LoanRegistry
/// @notice External wrapper contract implementing the loan registry package.
contract LoanRegistry is ILoanRegistry, LoanRegistryInternal {
    /// @inheritdoc ILoanRegistry
    function createLoan(
        LoanParams calldata p
    ) external override returns (uint256 loanId) {
        loanId = _createLoan(p);
    }

    /// @inheritdoc ILoanRegistry
    function getLoan(
        uint256 loanId
    ) external view override returns (Loan memory loan) {
        return _getLoan(loanId);
    }
}
