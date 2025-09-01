"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeAllStorageSlots = exports.STORAGE_SLOTS = exports.computeStorageSlot = void 0;
const ethers_1 = require("ethers");
/**
 * Computes a custom storage slot hash for diamond storage pattern
 * This follows the diamond storage pattern used in EIP-2535
 * @param baseString - The base string to compute storage slot for (e.g., "swift.storage.DiamondBase")
 * @param verbose - Whether to log intermediate steps
 * @returns The computed storage slot as hex string
 */
function computeStorageSlot(baseString, verbose = false) {
    if (verbose) {
        console.log(`🔍 Computing storage slot for: "${baseString}"`);
    }
    // Step 1: Compute keccak256 of the base string
    const baseStringHash = ethers_1.ethers.keccak256(ethers_1.ethers.toUtf8Bytes(baseString));
    if (verbose) {
        console.log('Step 1 - Hash of base string:', baseStringHash);
    }
    // Step 2: Convert hash to BigInt and subtract 1
    const baseHashBigInt = BigInt(baseStringHash);
    const baseHashMinusOne = baseHashBigInt - 1n;
    if (verbose) {
        console.log('Step 2 - Base hash minus one:', `0x${baseHashMinusOne.toString(16)}`);
    }
    // Step 3: ABI-encode the result
    const abiCoder = new ethers_1.ethers.AbiCoder();
    const encodedData = abiCoder.encode(['uint256'], [baseHashMinusOne]);
    if (verbose) {
        console.log('Step 3 - ABI-encoded data:', encodedData);
    }
    // Step 4: Compute keccak256 of the encoded data
    const finalHash = ethers_1.ethers.keccak256(encodedData);
    if (verbose) {
        console.log('Step 4 - Keccak256 of encoded data:', finalHash);
    }
    // Step 5: Compute ~bytes32(uint256(0xff)) - mask for collision avoidance
    const ffUint256 = 0xffn; // BigInt representation of 0xff
    const mask = (1n << 256n) - 1n; // 256-bit mask of all 1s
    const invertedFF = ~ffUint256 & mask;
    if (verbose) {
        console.log('Step 5 - Inverted 0xff bytes32:', `0x${invertedFF.toString(16).padStart(64, '0')}`);
    }
    // Step 6: Perform bitwise AND of finalHash and invertedFF
    const finalHashBigInt = BigInt(finalHash);
    const resultBigInt = finalHashBigInt & invertedFF;
    const resultHex = `0x${resultBigInt.toString(16).padStart(64, '0')}`;
    if (verbose) {
        console.log('Step 6 - Final result:', resultHex);
    }
    return resultHex;
}
exports.computeStorageSlot = computeStorageSlot;
/**
 * Pre-defined storage slots for common ERC3643 components
 */
exports.STORAGE_SLOTS = {
    DIAMOND_BASE: 'swift.storage.DiamondBase',
    EIP712: 'swift.storage.EIP712',
    TOKEN: 'swift.storage.Token',
    IDENTITY_REGISTRY: 'swift.storage.IdentityRegistry',
    COMPLIANCE: 'swift.storage.Compliance',
    AGENT_ROLE: 'swift.storage.AgentRole',
    PACKAGE_CONTROLLER: 'swift.storage.PackageController',
    PACKAGE_VIEWER: 'swift.storage.PackageViewer',
};
/**
 * Computes storage slots for all predefined storage types
 * @param verbose - Whether to show detailed computation steps
 * @returns Object mapping storage names to their computed slots
 */
function computeAllStorageSlots(verbose = false) {
    const results = {};
    console.log('📊 Computing storage slots for ERC3643 components...\n');
    Object.entries(exports.STORAGE_SLOTS).forEach(([name, baseString]) => {
        if (verbose) {
            console.log(`\n--- Computing ${name} ---`);
        }
        const slot = computeStorageSlot(baseString, verbose);
        results[name] = slot;
        console.log(`✅ ${name.padEnd(20)}: ${slot}`);
    });
    return results;
}
exports.computeAllStorageSlots = computeAllStorageSlots;
/**
 * Main function for CLI usage
 */
async function main() {
    const args = process.argv.slice(2);
    if (args.length === 0) {
        // Compute all storage slots
        computeAllStorageSlots(false);
    }
    else if (args[0] === '--verbose' || args[0] === '-v') {
        // Compute all storage slots with verbose output
        computeAllStorageSlots(true);
    }
    else {
        // Compute specific storage slot
        const baseString = args[0];
        const verbose = args.includes('--verbose') || args.includes('-v');
        console.log(`Computing storage slot for: "${baseString}"`);
        const slot = computeStorageSlot(baseString, verbose);
        console.log(`Storage slot: ${slot}`);
    }
}
// Execute if run directly
if (require.main === module) {
    main().catch(console.error);
}
