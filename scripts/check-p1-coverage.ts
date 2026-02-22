import fs from 'fs';
import path from 'path';

const coverageFile = 'coverage/coverage-final.json';

if (!fs.existsSync(coverageFile)) {
  console.error('Coverage file not found. Run npm run test:coverage first.');
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(coverageFile, 'utf8'));

// Analyze utils layer
console.log('\n📊 P1 Coverage Analysis - Utils Layer\n');
console.log('='.repeat(60));

const utils = Object.keys(data).filter(
  (k) =>
    (k.includes('/utils/') || k.includes('\\utils\\')) &&
    !k.includes('test') &&
    !k.includes('node_modules')
);

let totalUtilsStmts = 0;
let coveredUtilsStmts = 0;

utils.forEach((filePath) => {
  const cov = data[filePath];
  const stmts = cov.s;
  const total = Object.keys(stmts).length;
  const covered = Object.values(stmts).filter((v: number) => v > 0).length;
  const pct = total > 0 ? ((covered / total) * 100).toFixed(2) : '0.00';

  totalUtilsStmts += total;
  coveredUtilsStmts += covered;

  const fileName = path.basename(filePath);
  const status = parseFloat(pct) >= 70 ? '✅' : '❌';
  console.log(`${status} ${fileName.padEnd(35)} ${pct}%`);
});

const utilsPct =
  totalUtilsStmts > 0 ? ((coveredUtilsStmts / totalUtilsStmts) * 100).toFixed(2) : '0.00';
console.log('='.repeat(60));
console.log(`Overall Utils Coverage: ${utilsPct}% (Target: 70%)`);

// Analyze contexts layer
console.log('\n📊 P1 Coverage Analysis - Contexts Layer\n');
console.log('='.repeat(60));

const contexts = Object.keys(data).filter(
  (k) =>
    (k.includes('/contexts/') || k.includes('\\contexts\\')) &&
    !k.includes('test') &&
    !k.includes('node_modules')
);

let totalContextsStmts = 0;
let coveredContextsStmts = 0;

contexts.forEach((filePath) => {
  const cov = data[filePath];
  const stmts = cov.s;
  const total = Object.keys(stmts).length;
  const covered = Object.values(stmts).filter((v: number) => v > 0).length;
  const pct = total > 0 ? ((covered / total) * 100).toFixed(2) : '0.00';

  totalContextsStmts += total;
  coveredContextsStmts += covered;

  const fileName = path.basename(filePath);
  const status = parseFloat(pct) >= 70 ? '✅' : '❌';
  console.log(`${status} ${fileName.padEnd(35)} ${pct}%`);
});

const contextsPct =
  totalContextsStmts > 0 ? ((coveredContextsStmts / totalContextsStmts) * 100).toFixed(2) : '0.00';
console.log('='.repeat(60));
console.log(`Overall Contexts Coverage: ${contextsPct}% (Target: 70%)`);

// Summary
console.log('\n📋 P1 Summary\n');
console.log('='.repeat(60));
console.log(`Utils Layer:     ${utilsPct}% ${parseFloat(utilsPct) >= 70 ? '✅' : '❌'}`);
console.log(`Contexts Layer:  ${contextsPct}% ${parseFloat(contextsPct) >= 70 ? '✅' : '❌'}`);
console.log('='.repeat(60));

if (parseFloat(utilsPct) < 70 || parseFloat(contextsPct) < 70) {
  console.log('\n⚠️  P1 coverage targets NOT met. Additional tests needed.');
  process.exit(1);
} else {
  console.log('\n✅ P1 coverage targets met!');
  process.exit(0);
}
