// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

/// @title LoanFunding Storage
/// @notice Simple namespaced storage (placeholder for future fields)
library LoanFundingStorage {
    struct Layout {
        // reserved for future use
        uint256 reserved;
    }

    // keccak256("fevertokens.storage.microloan.LoanFunding") minus 1, masked
    bytes32 internal constant STORAGE_SLOT =
        keccak256(abi.encode(uint256(keccak256("fevertokens.storage.microloan.LoanFunding")) - 1)) &
            ~bytes32(uint256(0xff));

    function layout() internal pure returns (Layout storage l) {
        bytes32 slot = STORAGE_SLOT;
        assembly {
            l.slot := slot
        }
    }
}

