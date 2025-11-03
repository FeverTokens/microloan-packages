// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {IERC20} from "@fevertokens/packages/contracts/token/ERC20/IERC20.sol";

/// @title StableCoin
/// @notice Minimal ERC20-like token for testing microloan flows.
/// @dev Implements IERC20 with simple owner-controlled minting.
contract StableCoin is IERC20 {
    string public name;
    string public symbol;
    uint8 public immutable decimals;
    uint256 public override totalSupply;

    mapping(address => uint256) public override balanceOf;
    mapping(address => mapping(address => uint256)) public override allowance;

    address public owner;

    /// @notice Set token metadata and initial owner
    /// @param name_ Token name
    /// @param symbol_ Token symbol
    /// @param decimals_ Token decimals (e.g., 18 or 6)
    constructor(string memory name_, string memory symbol_, uint8 decimals_) {
        name = name_;
        symbol = symbol_;
        decimals = decimals_;
        owner = msg.sender;
    }

    /// @notice Restrict function to owner
    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    /// @notice Mint new tokens to an account
    /// @param to Recipient address
    /// @param amount Amount to mint
    function mint(address to, uint256 amount) external onlyOwner {
        totalSupply += amount;
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }

    /// @notice Approve spender for allowance
    function approve(
        address spender,
        uint256 amount
    ) external override returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    /// @notice Transfer tokens to recipient
    function transfer(
        address recipient,
        uint256 amount
    ) external override returns (bool) {
        _transfer(msg.sender, recipient, amount);
        return true;
    }

    /// @notice Transfer tokens from holder to recipient using allowance
    function transferFrom(
        address holder,
        address recipient,
        uint256 amount
    ) external override returns (bool) {
        uint256 allowed = allowance[holder][msg.sender];
        require(allowed >= amount, "allowance");
        if (allowed != type(uint256).max) {
            allowance[holder][msg.sender] = allowed - amount;
            emit Approval(holder, msg.sender, allowance[holder][msg.sender]);
        }
        _transfer(holder, recipient, amount);
        return true;
    }

    /// @dev Internal token transfer
    function _transfer(address from, address to, uint256 amount) internal {
        require(to != address(0), "to=0");
        uint256 bal = balanceOf[from];
        require(bal >= amount, "balance");
        unchecked {
            balanceOf[from] = bal - amount;
        }
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
    }
}
