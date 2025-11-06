// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {ILoanRepaymentInternal} from "./ILoanRepaymentInternal.sol";
import {LoanRepaymentStorage} from "./LoanRepaymentStorage.sol";
import "../registry/ILoanRegistryInternal.sol";
import {LoanRegistryStorage} from "../registry/LoanRegistryStorage.sol";
import {MicroLoanMath} from "../math/MicroLoanMath.sol";
import {IERC20} from "@fevertokens/packages/contracts/token/ERC20/IERC20.sol";

/// @title LoanRepayment Internal Logic
/// @notice Processes equal-payment schedule repayments and status transitions.
abstract contract LoanRepaymentInternal is ILoanRepaymentInternal {
    using LoanRepaymentStorage for LoanRepaymentStorage.Layout;

    /// @notice Repay the next due installment based on stored schedule parameters
    /// @param loanId Loan identifier
    function _repayNextInstallment(uint256 loanId) internal {
        LoanRegistryStorage.Layout storage s = LoanRegistryStorage.layout();
        Loan storage l = s.loans[loanId];
        require(l.id != 0, "loan not found");
        require(
            l.status == LoanStatus.Funded || l.status == LoanStatus.Active,
            "status"
        );
        require(msg.sender == l.params.borrower, "only borrower");

        // Compute interest for period using monthly rate
        uint256 rMonthlyWad = (uint256(l.params.interestRateBps) *
            MicroLoanMath.WAD) /
            MicroLoanMath.BPS /
            12;
        uint256 interestDue = MicroLoanMath.wMul(
            l.outstandingPrincipal * MicroLoanMath.WAD,
            rMonthlyWad
        ) / MicroLoanMath.WAD;

        // Use preset installment amount; clamp last payment
        uint256 installment = l.installmentAmount;
        uint256 totalDue = interestDue + l.outstandingPrincipal;
        if (installment > totalDue) {
            installment = totalDue;
        }
        uint256 principalPaid = installment - interestDue;

        // transfer payment borrower -> lender
        IERC20(l.params.token).transferFrom(
            l.params.borrower,
            l.lender,
            installment
        );

        // update accounting
        l.outstandingPrincipal -= principalPaid;
        if (l.remainingPeriods > 0) {
            l.remainingPeriods -= 1;
        }
        l.totalPaid += installment;
        l.lastPaymentDate = block.timestamp;
        // advance due date by approx. 30 days (demo grade)
        l.nextDueDate = l.nextDueDate + 30 days;

        // Activate if needed
        if (l.status == LoanStatus.Funded) {
            l.status = LoanStatus.Active;
        }

        emit LoanInstallmentRepaid(
            loanId,
            msg.sender,
            interestDue,
            principalPaid,
            l.outstandingPrincipal
        );

        if (l.outstandingPrincipal == 0 || l.remainingPeriods == 0) {
            l.status = LoanStatus.Closed;
            emit LoanClosed(loanId);
            // borrowerActiveLoanId cleared in registry when status set via helper; here we set directly
            if (s.borrowerActiveLoanId[l.params.borrower] == loanId) {
                s.borrowerActiveLoanId[l.params.borrower] = 0;
            }
        }
    }
}
