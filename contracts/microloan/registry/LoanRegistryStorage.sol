// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {ILoanRegistryInternal} from "./ILoanRegistryInternal.sol";

/// @title LoanRegistry Storage
/// @notice ERC-7201-style namespaced storage for the loan registry package.
library LoanRegistryStorage {
    /// @notice Layout for registry state
    struct Layout {
        uint256 lastId;
        mapping(uint256 => ILoanRegistryInternal.Loan) loans;
        // Track a borrower's active loan (0 if none). For demo, one active loan at a time.
        mapping(address => uint256) borrowerActiveLoanId;
    }

    // keccak256("fevertokens.storage.microloan.LoanRegistry") minus 1, masked
    bytes32 internal constant STORAGE_SLOT =
        keccak256(abi.encode(uint256(keccak256("fevertokens.storage.microloan.LoanRegistry")) - 1)) &
            ~bytes32(uint256(0xff));

    /// @notice Accessor for layout
    function layout() internal pure returns (Layout storage l) {
        bytes32 slot = STORAGE_SLOT;
        assembly {
            l.slot := slot
        }
    }
}

