// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title SimpleStorage
 * @dev Store and retrieve a value
 */
contract SimpleStorage {
    uint256 private storedValue;
    address public owner;

    event ValueChanged(uint256 newValue, address changedBy);

    constructor(uint256 initialValue) {
        storedValue = initialValue;
        owner = msg.sender;
    }

    function set(uint256 newValue) public {
        storedValue = newValue;
        emit ValueChanged(newValue, msg.sender);
    }

    function get() public view returns (uint256) {
        return storedValue;
    }
}
