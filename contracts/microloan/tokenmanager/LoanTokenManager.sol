// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {ILoanTokenManager} from "./ILoanTokenManager.sol";
import {LoanTokenManagerInternal} from "./LoanTokenManagerInternal.sol";

/// @title LoanTokenManager
/// @notice External wrapper for internal balance accounting.
contract LoanTokenManager is ILoanTokenManager, LoanTokenManagerInternal {
    /// @inheritdoc ILoanTokenManager
    function deposit(address token, uint256 amount) external override {
        _deposit(token, amount);
    }

    /// @inheritdoc ILoanTokenManager
    function withdraw(address token, uint256 amount) external override {
        _withdraw(token, amount);
    }

    /// @inheritdoc ILoanTokenManager
    function balanceOf(address user, address token) external view override returns (uint256) {
        return _balanceOf(user, token);
    }
}

