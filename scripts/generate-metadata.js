"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findArtifacts = exports.generateMetadata = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
/**
 * Recursively finds and processes contract artifacts from the artifacts directory
 * @param dir - Directory to search for artifacts
 * @param artifacts - Accumulated artifacts object
 * @returns Object containing all contract artifacts
 */
function findArtifacts(dir, artifacts = {}) {
    const files = (0, fs_1.readdirSync)(dir);
    for (const file of files) {
        const fullPath = (0, path_1.join)(dir, file);
        const stat = (0, fs_1.statSync)(fullPath);
        if (stat.isDirectory()) {
            findArtifacts(fullPath, artifacts);
        }
        else if (file.endsWith('.json') && !file.endsWith('.dbg.json')) {
            try {
                const artifactContent = (0, fs_1.readFileSync)(fullPath, 'utf8');
                const artifact = JSON.parse(artifactContent);
                if (artifact.abi && artifact.contractName) {
                    const key = `${artifact.sourceName}:${artifact.contractName}`;
                    artifacts[key] = {
                        abi: artifact.abi,
                        bin: artifact.bytecode || ''
                    };
                }
            }
            catch (error) {
                // Skip invalid JSON files
                console.warn(`Warning: Could not parse artifact file ${fullPath}:`, error);
            }
        }
    }
    return artifacts;
}
exports.findArtifacts = findArtifacts;
/**
 * Generates combined metadata file from contract artifacts
 */
function generateMetadata() {
    const artifactsDir = (0, path_1.join)(__dirname, '..', 'artifacts', 'contracts');
    const artifacts = findArtifacts(artifactsDir);
    const combined = {
        contracts: artifacts
    };
    const outputPath = (0, path_1.join)(__dirname, '..', 'metadata', 'combined.json');
    try {
        (0, fs_1.writeFileSync)(outputPath, JSON.stringify(combined, null, 2));
        console.log(`✅ Generated combined.json with ${Object.keys(artifacts).length} contracts`);
        // Log some statistics
        const contractNames = Object.keys(artifacts);
        const contractCount = contractNames.length;
        const filesProcessed = contractNames.map(name => name.split(':')[0]);
        const uniqueFiles = [...new Set(filesProcessed)].length;
        console.log(`📊 Metadata Statistics:`);
        console.log(`   - Contracts processed: ${contractCount}`);
        console.log(`   - Source files: ${uniqueFiles}`);
        console.log(`   - Output file: ${outputPath}`);
    }
    catch (error) {
        console.error('❌ Error generating metadata:', error);
        process.exit(1);
    }
}
exports.generateMetadata = generateMetadata;
// Execute if run directly
if (require.main === module) {
    generateMetadata();
}
