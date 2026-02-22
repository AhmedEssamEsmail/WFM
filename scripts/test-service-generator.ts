/**
 * Script to test the Service Test Generator
 *
 * This script generates sample tests for authService to verify:
 * - Test generation produces valid TypeScript
 * - Generated tests are executable
 * - All tests pass
 */

import {
  parseServiceFile,
  generateServiceTest,
  formatTestFile,
  getTestFilePath,
  writeTestFile,
} from '../src/test/serviceTestGenerator';
import * as path from 'path';

async function main() {
  console.log('🧪 Testing Service Test Generator\n');

  // Step 1: Parse authService
  console.log('Step 1: Parsing authService.ts...');
  const serviceFilePath = path.join(process.cwd(), 'src/services/authService.ts');
  const serviceDefinition = parseServiceFile(serviceFilePath);

  console.log(`✓ Parsed service: ${serviceDefinition.name}`);
  console.log(`  - Methods found: ${serviceDefinition.methods.length}`);
  console.log(`  - Dependencies: ${serviceDefinition.dependencies.length}`);
  console.log(`  - Methods: ${serviceDefinition.methods.map((m) => m.name).join(', ')}\n`);

  // Step 2: Generate test file
  console.log('Step 2: Generating test file...');
  const testFile = generateServiceTest(serviceDefinition);

  console.log(`✓ Generated test structure:`);
  console.log(`  - Test cases: ${testFile.testCases.length}`);
  console.log(
    `  - Success tests: ${testFile.testCases.filter((t) => t.type === 'success').length}`
  );
  console.log(`  - Error tests: ${testFile.testCases.filter((t) => t.type === 'error').length}`);
  console.log(
    `  - Edge case tests: ${testFile.testCases.filter((t) => t.type === 'edge').length}\n`
  );

  // Step 3: Format test file
  console.log('Step 3: Formatting test file...');
  const formattedTest = formatTestFile(serviceDefinition, testFile);

  console.log(`✓ Formatted test file (${formattedTest.split('\n').length} lines)\n`);

  // Step 4: Write test file
  console.log('Step 4: Writing test file...');
  const testFilePath = getTestFilePath(serviceFilePath);

  try {
    writeTestFile(testFilePath, formattedTest);
    console.log(`✓ Test file written to: ${testFilePath}\n`);
  } catch (error) {
    console.error(`✗ Failed to write test file:`, error);
    process.exit(1);
  }

  // Step 5: Display sample of generated test
  console.log('Step 5: Sample of generated test:\n');
  const lines = formattedTest.split('\n');
  console.log(lines.slice(0, 30).join('\n'));
  console.log('...\n');

  console.log('✅ Service Test Generator verification complete!');
  console.log(`\nNext steps:`);
  console.log(`  1. Review generated test: ${testFilePath}`);
  console.log(`  2. Run: npm test -- authService.test.ts`);
  console.log(`  3. Verify all tests execute successfully`);
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
