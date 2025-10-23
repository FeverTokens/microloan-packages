// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

/// @title LoanFunding Storage
/// @notice Simple namespaced storage (placeholder for future fields)
library LoanFundingStorage {
    struct Layout {
        // reserved for future use
        uint256 reserved;
    }

    /**
     * @dev Storage slot constant for the LoanFunding storage layout.
     * @custom:storage-location erc7201:fevertokens.storage.LoanFunding
     */
    bytes32 internal constant STORAGE_SLOT =
        0xa97e2393236e493d3217df94a923904b275c211fceb42d0cac1e305bc128b900;

    // keccak256(abi.encode(uint256(keccak256("fevertokens.storage.LoanFunding")) - 1)) & ~bytes32(uint256(0xff));

    function layout() internal pure returns (Layout storage l) {
        bytes32 slot = STORAGE_SLOT;
        assembly {
            l.slot := slot
        }
    }
}
