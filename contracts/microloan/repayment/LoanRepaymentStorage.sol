// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

/// @title LoanRepayment Storage
/// @notice Placeholder namespaced storage for repayment package
library LoanRepaymentStorage {
    struct Layout {
        // reserved for future use (e.g., penalties)
        uint256 reserved;
    }

    /**
     * @dev Storage slot constant for the LoanRepayment storage layout.
     * @custom:storage-location erc7201:fevertokens.storage.LoanRepayment
     */
    bytes32 internal constant STORAGE_SLOT =
        0xb0986a0190c2dac0a0df0c440ce43626dd10528b9c78afc506878953d7a1f100;

    // keccak256(abi.encode(uint256(keccak256("fevertokens.storage.LoanRepayment")) - 1)) & ~bytes32(uint256(0xff));

    function layout() internal pure returns (Layout storage l) {
        bytes32 slot = STORAGE_SLOT;
        assembly {
            l.slot := slot
        }
    }
}
