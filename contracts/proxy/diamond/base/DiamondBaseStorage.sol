// SPDX-License-Identifier: MIT
// FeverTokens Contracts v1.0.0

pragma solidity 0.8.26;

/**
 * @dev derived from https://github.com/mudgen/diamond-2 (MIT license)
 */
library DiamondBaseStorage {
    struct Layout {
        // function selector => (facet address, selector slot position)
        mapping(bytes4 => bytes32) facets;
        // total number of selectors registered
        uint16 selectorCount;
        // array of selector slots with 8 selectors per slot
        mapping(uint256 => bytes32) selectorSlots;
        address fallbackAddress;
    }

    /**
     * @dev Storage slot constant for the DiamondBase storage layout.
     * @custom:storage-location erc7201:fevertokens.storage.DiamondBase
     */
    //
    bytes32 internal constant STORAGE_SLOT = 0x1b2445302ce240fde4bd8df515e13351b095f32c40c3b869a9bcedc5f0809900;
    // keccak256(abi.encode(uint256(keccak256("fevertokens.storage.DiamondBase")) - 1)) & ~bytes32(uint256(0xff));

    function layout() internal pure returns (Layout storage l) {
        bytes32 slot = STORAGE_SLOT;
        assembly {
            l.slot := slot
        }
    }
}
