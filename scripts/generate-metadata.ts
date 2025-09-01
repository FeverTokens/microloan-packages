import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

interface ContractArtifact {
  abi: any[];
  bytecode: string;
  contractName?: string;
  sourceName?: string;
}

interface CombinedContract {
  abi: any[];
  bin: string;
}

interface CombinedMetadata {
  contracts: Record<string, CombinedContract>;
}

/**
 * Recursively finds and processes contract artifacts from the artifacts directory
 * @param dir - Directory to search for artifacts
 * @param artifacts - Accumulated artifacts object
 * @returns Object containing all contract artifacts
 */
function findArtifacts(dir: string, artifacts: Record<string, CombinedContract> = {}): Record<string, CombinedContract> {
  const files = readdirSync(dir);
  
  for (const file of files) {
    const fullPath = join(dir, file);
    const stat = statSync(fullPath);
    
    if (stat.isDirectory()) {
      findArtifacts(fullPath, artifacts);
    } else if (file.endsWith('.json') && !file.endsWith('.dbg.json')) {
      try {
        const artifactContent = readFileSync(fullPath, 'utf8');
        const artifact: ContractArtifact = JSON.parse(artifactContent);
        
        if (artifact.abi && artifact.contractName) {
          const key = `${artifact.sourceName}:${artifact.contractName}`;
          artifacts[key] = {
            abi: artifact.abi,
            bin: artifact.bytecode || ''
          };
        }
      } catch (error) {
        // Skip invalid JSON files
        console.warn(`Warning: Could not parse artifact file ${fullPath}:`, error);
      }
    }
  }
  
  return artifacts;
}

/**
 * Generates combined metadata file from contract artifacts
 */
function generateMetadata(): void {
  const artifactsDir = join(__dirname, '..', 'artifacts', 'contracts');
  const artifacts = findArtifacts(artifactsDir);

  const combined: CombinedMetadata = {
    contracts: artifacts
  };

  const outputPath = join(__dirname, '..', 'metadata', 'combined.json');
  
  try {
    writeFileSync(outputPath, JSON.stringify(combined, null, 2));
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
  } catch (error) {
    console.error('❌ Error generating metadata:', error);
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  generateMetadata();
}

export { generateMetadata, findArtifacts };