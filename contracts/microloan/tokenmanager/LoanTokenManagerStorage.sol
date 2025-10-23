// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

/// @title LoanTokenManager Storage
/// @notice Namespaced storage for internal ERC20 balances.
library LoanTokenManagerStorage {
    struct Layout {
        mapping(address => mapping(address => uint256)) balances; // user => token => balance
    }

    /**
     * @dev Storage slot constant for the LoanTokenManager storage layout.
     * @custom:storage-location erc7201:fevertokens.storage.LoanTokenManager
     */
    bytes32 internal constant STORAGE_SLOT =
        0xc0ebc5d05671a70259f8bda42143c4e45792e607e128b351352360b0f71e8100;

    // keccak256(abi.encode(uint256(keccak256("fevertokens.storage.LoanTokenManager")) - 1)) & ~bytes32(uint256(0xff));

    function layout() internal pure returns (Layout storage l) {
        bytes32 slot = STORAGE_SLOT;
        assembly {
            l.slot := slot
        }
    }
}
