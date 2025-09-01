// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {ILoanTokenManagerInternal} from "./ILoanTokenManagerInternal.sol";
import {LoanTokenManagerStorage} from "./LoanTokenManagerStorage.sol";
import {IERC20} from "../../token/ERC20/IERC20.sol";

/// @title LoanTokenManager Internal Logic
/// @notice Minimal internal balance accounting with direct token transfers.
abstract contract LoanTokenManagerInternal is ILoanTokenManagerInternal {
    using LoanTokenManagerStorage for LoanTokenManagerStorage.Layout;

    /// @notice Deposit tokens into caller's internal balance
    function _deposit(address token, uint256 amount) internal {
        require(token != address(0), "token=0");
        require(amount > 0, "amount=0");
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        LoanTokenManagerStorage.layout().balances[msg.sender][token] += amount;
        emit Deposited(msg.sender, token, amount);
    }

    /// @notice Withdraw tokens from caller's internal balance
    function _withdraw(address token, uint256 amount) internal {
        require(token != address(0), "token=0");
        require(amount > 0, "amount=0");
        mapping(address => uint256) storage m = LoanTokenManagerStorage.layout().balances[msg.sender];
        require(m[token] >= amount, "insufficient");
        m[token] -= amount;
        IERC20(token).transfer(msg.sender, amount);
        emit Withdrawn(msg.sender, token, amount);
    }

    /// @notice Read internal balance for given user and token
    function _balanceOf(address user, address token) internal view returns (uint256) {
        return LoanTokenManagerStorage.layout().balances[user][token];
    }
}

