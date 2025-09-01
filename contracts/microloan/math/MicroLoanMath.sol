// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

/// @title MicroLoanMath
/// @notice WAD math utilities (1e18) and annuity payment helper for equal installments.
library MicroLoanMath {
    uint256 internal constant WAD = 1e18;
    uint256 internal constant BPS = 10_000;

    /// @notice Multiply two WAD-scaled values.
    /// @param a First operand (WAD)
    /// @param b Second operand (WAD)
    /// @return Product (WAD)
    function wMul(uint256 a, uint256 b) internal pure returns (uint256) {
        return (a * b) / WAD;
    }

    /// @notice Divide two WAD-scaled values.
    /// @param a Numerator (WAD)
    /// @param b Denominator (WAD)
    /// @return Quotient (WAD)
    function wDiv(uint256 a, uint256 b) internal pure returns (uint256) {
        return (a * WAD) / b;
    }

    /// @notice Compute (1 + r)^n where r is WAD-scaled.
    /// @param rWad Periodic rate (WAD)
    /// @param n Number of periods
    /// @return acc Result (WAD)
    function pow1p(uint256 rWad, uint256 n) internal pure returns (uint256 acc) {
        uint256 base = WAD + rWad; // (1 + r)
        acc = WAD;
        for (uint256 i = 0; i < n; i++) {
            acc = wMul(acc, base);
        }
    }

    /// @notice Annuity payment calculation: M = P * r / (1 - (1+r)^(-n))
    /// @param principalWad Principal (WAD)
    /// @param rWad Periodic rate (WAD)
    /// @param n Number of periods
    /// @return paymentWad Payment amount per period (WAD)
    function annuityPayment(
        uint256 principalWad,
        uint256 rWad,
        uint256 n
    ) internal pure returns (uint256 paymentWad) {
        if (rWad == 0) {
            return principalWad / n;
        }
        uint256 pow = pow1p(rWad, n); // (1+r)^n
        uint256 numerator = wMul(principalWad, rWad); // P * r
        uint256 denom = (WAD - wDiv(WAD, pow)); // 1 - 1/(1+r)^n
        return wDiv(numerator, denom);
    }
}
