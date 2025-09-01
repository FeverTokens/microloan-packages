// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

/// @title LoanTokenManager Internal Interface
/// @notice Events for escrow-like internal balances (optional utility).
interface ILoanTokenManagerInternal {
    /// @notice Emitted on deposit into internal balance
    event Deposited(address indexed account, address indexed token, uint256 amount);

    /// @notice Emitted on withdrawal from internal balance
    event Withdrawn(address indexed account, address indexed token, uint256 amount);
}

