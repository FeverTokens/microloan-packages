// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Loan} from "./ILoanRegistryInternal.sol";

/// @title LoanRegistry Storage
/// @notice ERC-7201-style namespaced storage for the loan registry package.
library LoanRegistryStorage {
    /// @notice Layout for registry state
    struct Layout {
        uint256 lastId;
        mapping(uint256 => Loan) loans;
        // Track a borrower's active loan (0 if none). For demo, one active loan at a time.
        mapping(address => uint256) borrowerActiveLoanId;
    }

    /**
     * @dev Storage slot constant for the LoanRegistry storage layout.
     * @custom:storage-location erc7201:fevertokens.storage.LoanRegistry
     */
    bytes32 internal constant STORAGE_SLOT =
        0x489855b9aebe42b1c00e9087562cf0ed5028a6ad980ac098e3c06da1f21a0900;

    // keccak256(abi.encode(uint256(keccak256("fevertokens.storage.LoanRegistry")) - 1)) & ~bytes32(uint256(0xff));

    /// @notice Accessor for layout
    function layout() internal pure returns (Layout storage l) {
        bytes32 slot = STORAGE_SLOT;
        assembly {
            l.slot := slot
        }
    }
}
