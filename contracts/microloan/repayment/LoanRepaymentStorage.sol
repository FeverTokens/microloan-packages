// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

/// @title LoanRepayment Storage
/// @notice Placeholder namespaced storage for repayment package
library LoanRepaymentStorage {
    struct Layout {
        // reserved for future use (e.g., penalties)
        uint256 reserved;
    }

    // keccak256("fevertokens.storage.microloan.LoanRepayment") minus 1, masked
    bytes32 internal constant STORAGE_SLOT =
        keccak256(abi.encode(uint256(keccak256("fevertokens.storage.microloan.LoanRepayment")) - 1)) &
            ~bytes32(uint256(0xff));

    function layout() internal pure returns (Layout storage l) {
        bytes32 slot = STORAGE_SLOT;
        assembly {
            l.slot := slot
        }
    }
}

