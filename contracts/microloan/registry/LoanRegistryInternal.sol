// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {ILoanRegistryInternal} from "./ILoanRegistryInternal.sol";
import {LoanRegistryStorage} from "./LoanRegistryStorage.sol";
import {MicroLoanMath} from "../math/MicroLoanMath.sol";

/// @title LoanRegistry Internal Logic
/// @notice Implements creation and accessors for loan records using namespaced storage.
abstract contract LoanRegistryInternal is ILoanRegistryInternal {
    using LoanRegistryStorage for LoanRegistryStorage.Layout;


    /// @notice Create a loan and initialize computed fields
    /// @param p Parameters supplied by caller
    /// @return loanId Newly allocated loan id
    function _createLoan(LoanParams memory p) internal returns (uint256 loanId) {
        require(p.borrower != address(0), "borrower=0");
        require(p.token != address(0), "token=0");
        require(p.loanAmount > 0, "amount=0");
        require(p.termInMonths > 0, "term=0");

        LoanRegistryStorage.Layout storage s = LoanRegistryStorage.layout();

        // Enforce single active loan policy at registry level (simple demo policy)
        uint256 activeId = s.borrowerActiveLoanId[p.borrower];
        if (activeId != 0) {
            // If an active id exists but is closed/defaulted, allow; otherwise revert
            Loan storage existing = s.loans[activeId];
            require(
                existing.status == LoanStatus.Closed || existing.status == LoanStatus.Defaulted,
                "borrower has active loan"
            );
        }

        // Compute fees and cash flows
        uint256 feeAmount = (p.loanAmount * uint256(p.fileFeeBps)) / MicroLoanMath.BPS;
        uint256 principalOwed = p.loanAmount + (p.addFeeToPrincipal ? feeAmount : 0);
        uint256 disbursedAmount = p.loanAmount - (p.feeDeductedUpfront ? feeAmount : 0);

        // Compute monthly payment for EqualPayments (DecliningBalance)
        uint256 rMonthlyWad = (uint256(p.interestRateBps) * MicroLoanMath.WAD) / MicroLoanMath.BPS / 12; // APR->monthly, WAD-scaled
        uint256 installmentAmount =
            MicroLoanMath.annuityPayment(principalOwed * MicroLoanMath.WAD, rMonthlyWad, p.termInMonths) /
                MicroLoanMath.WAD;

        // Assign ID and populate state
        s.lastId += 1;
        loanId = s.lastId;

        Loan storage l = s.loans[loanId];
        l.id = loanId;
        l.params = p;
        l.feeAmount = feeAmount;
        l.principalOwed = principalOwed;
        l.disbursedAmount = disbursedAmount;
        l.outstandingPrincipal = principalOwed;
        l.installmentAmount = installmentAmount;
        l.remainingPeriods = p.termInMonths;
        l.nextDueDate = p.firstPaymentDate;
        l.totalPaid = 0;
        l.lastPaymentDate = 0;
        l.status = LoanStatus.Created;

        // mark borrower as having an active loan id upon creation
        s.borrowerActiveLoanId[p.borrower] = loanId;

        emit LoanCreated(loanId, p.borrower, p.token, principalOwed, disbursedAmount);
    }

    /// @notice Get a copy of Loan state
    /// @param loanId Loan identifier
    /// @return loan Snapshot of stored loan
    function _getLoan(uint256 loanId) internal view returns (Loan memory loan) {
        loan = LoanRegistryStorage.layout().loans[loanId];
        require(loan.id != 0, "loan not found");
    }

    /// @notice Internal: update status with event
    function _setStatus(uint256 loanId, LoanStatus newStatus) internal {
        LoanRegistryStorage.Layout storage s = LoanRegistryStorage.layout();
        Loan storage l = s.loans[loanId];
        require(l.id != 0, "loan not found");
        LoanStatus old = l.status;
        l.status = newStatus;
        emit StatusUpdated(loanId, old, newStatus);

        // Maintain active loan pointer
        if (newStatus == LoanStatus.Closed || newStatus == LoanStatus.Defaulted) {
            if (s.borrowerActiveLoanId[l.params.borrower] == loanId) {
                s.borrowerActiveLoanId[l.params.borrower] = 0;
            }
        }
    }
}
