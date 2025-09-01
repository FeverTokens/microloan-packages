// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {IDiamondBase, DiamondBase} from "./diamond/base/DiamondBase.sol";
import {FacetCutAction, FacetCut, IPackageController, PackageControllerInternal} from "./diamond/control/PackageController.sol";
import {IPackageViewer} from "./diamond/view/IPackageViewer.sol";
import {IInitializable} from "./initializable/IInitializable.sol";
import {Proxy} from "./diamond/proxy/Proxy.sol";

/// @title MicroLoanDiamond
/// @notice Minimal Diamond proxy wired with PackageController, PackageViewer, and Initializable facets.

contract MicroLoanDiamond is
    IDiamondBase,
    DiamondBase,
    PackageControllerInternal
{
    constructor(
        address _packageControllerAddress,
        address _packageViewerAddress,
        address owner
    ) {
        // diamond cuts
        // Register PackageController and PackageViewer
        FacetCut[] memory facetCuts = new FacetCut[](2);

        // register PackageController
        bytes4[] memory packageControllerSelectors = new bytes4[](1);
        packageControllerSelectors[0] = IPackageController.diamondCut.selector;

        facetCuts[0] = FacetCut({
            target: _packageControllerAddress,
            action: FacetCutAction.ADD,
            selectors: packageControllerSelectors
        });

        // register PackageViewer
        bytes4[] memory packageViewerSelectors = new bytes4[](4);
        packageViewerSelectors[0] = IPackageViewer.facets.selector;
        packageViewerSelectors[1] = IPackageViewer
            .facetFunctionSelectors
            .selector;
        packageViewerSelectors[2] = IPackageViewer.facetAddresses.selector;
        packageViewerSelectors[3] = IPackageViewer.facetAddress.selector;

        facetCuts[1] = FacetCut({
            target: _packageViewerAddress,
            action: FacetCutAction.ADD,
            selectors: packageViewerSelectors
        });

        __PackageController_init(owner);

        _diamondCut(facetCuts, address(0), bytes(""));
    }
}
