// SPDX-License-Identifier: MIT
// FeverTokens Contracts v1.0.0

pragma solidity 0.8.26;

interface IProxy {
    error Proxy__ImplementationIsNotContract();

    fallback() external payable;
}
