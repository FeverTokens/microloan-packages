// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {ILoanTokenManagerInternal} from "./ILoanTokenManagerInternal.sol";

/// @title LoanTokenManager External Interface
/// @notice Simple internal balance accounting for tokens.
interface ILoanTokenManager is ILoanTokenManagerInternal {
    /// @notice Deposit tokens into internal balance
    function deposit(address token, uint256 amount) external;

    /// @notice Withdraw tokens from internal balance
    function withdraw(address token, uint256 amount) external;

    /// @notice Read internal balance
    function balanceOf(address user, address token) external view returns (uint256);
}

