// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {ILoanFundingInternal} from "./ILoanFundingInternal.sol";
import {LoanFundingStorage} from "./LoanFundingStorage.sol";
import {ILoanRegistryInternal} from "../registry/ILoanRegistryInternal.sol";
import {LoanRegistryStorage} from "../registry/LoanRegistryStorage.sol";
import {IERC20} from "@fevertokens/packages/contracts/token/ERC20/IERC20.sol";

/// @title LoanFunding Internal Logic
/// @notice Validates and executes loan funding.
abstract contract LoanFundingInternal is ILoanFundingInternal {
    using LoanFundingStorage for LoanFundingStorage.Layout;

    /// @notice Internal funding implementation: transfers disbursedAmount to borrower and marks status
    /// @param loanId Loan identifier
    function _fundLoan(uint256 loanId) internal {
        LoanRegistryStorage.Layout storage s = LoanRegistryStorage.layout();
        ILoanRegistryInternal.Loan storage l = s.loans[loanId];
        require(l.id != 0, "loan not found");
        require(l.status == ILoanRegistryInternal.LoanStatus.Created, "status");
        require(l.disbursedAmount > 0, "disbursed=0");

        // record lender and transfer funds to borrower
        l.lender = msg.sender;
        IERC20(l.params.token).transferFrom(
            msg.sender,
            l.params.borrower,
            l.disbursedAmount
        );

        // status → Funded
        ILoanRegistryInternal.LoanStatus old = l.status;
        l.status = ILoanRegistryInternal.LoanStatus.Funded;
        emit LoanFunded(loanId, msg.sender, l.disbursedAmount);

        // also surface registry-style status event if needed by offchain (optional)
        // Not emitting here to avoid import cycle; registry wrapper emits on its own.
        old; // silence unused var in case of removal of registry event coupling
    }
}
