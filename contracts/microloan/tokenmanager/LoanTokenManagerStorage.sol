// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

/// @title LoanTokenManager Storage
/// @notice Namespaced storage for internal ERC20 balances.
library LoanTokenManagerStorage {
    struct Layout {
        mapping(address => mapping(address => uint256)) balances; // user => token => balance
    }

    // keccak256("fevertokens.storage.microloan.LoanTokenManager") minus 1, masked
    bytes32 internal constant STORAGE_SLOT =
        keccak256(abi.encode(uint256(keccak256("fevertokens.storage.microloan.LoanTokenManager")) - 1)) &
            ~bytes32(uint256(0xff));

    function layout() internal pure returns (Layout storage l) {
        bytes32 slot = STORAGE_SLOT;
        assembly {
            l.slot := slot
        }
    }
}

