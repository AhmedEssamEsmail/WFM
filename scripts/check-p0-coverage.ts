import fs from 'fs';
import path from 'path';

const coverageFile = 'coverage/coverage-final.json';

if (!fs.existsSync(coverageFile)) {
  console.error('Coverage file not found. Run npm run test:coverage first.');
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(coverageFile, 'utf8'));

// Analyze services layer
console.log('\n📊 P0 Coverage Analysis - Services Layer\n');
console.log('='.repeat(60));

const services = Object.keys(data).filter(
  (k) =>
    (k.includes('/services/') || k.includes('\\services\\')) &&
    !k.includes('test') &&
    !k.includes('node_modules')
);

let totalServiceStmts = 0;
let coveredServiceStmts = 0;

services.forEach((filePath) => {
  const cov = data[filePath];
  const stmts = cov.s;
  const total = Object.keys(stmts).length;
  const covered = Object.values(stmts).filter((v: number) => v > 0).length;
  const pct = total > 0 ? ((covered / total) * 100).toFixed(2) : '0.00';

  totalServiceStmts += total;
  coveredServiceStmts += covered;

  const fileName = path.basename(filePath);
  const status = parseFloat(pct) >= 70 ? '✅' : '❌';
  console.log(`${status} ${fileName.padEnd(35)} ${pct}%`);
});

const servicesPct =
  totalServiceStmts > 0 ? ((coveredServiceStmts / totalServiceStmts) * 100).toFixed(2) : '0.00';
console.log('='.repeat(60));
console.log(`Overall Services Coverage: ${servicesPct}% (Target: 70%)`);

// Analyze validation layer
console.log('\n📊 P0 Coverage Analysis - Validation Layer\n');
console.log('='.repeat(60));

const validation = Object.keys(data).filter(
  (k) =>
    (k.includes('/validation/') || k.includes('\\validation\\')) &&
    !k.includes('test') &&
    !k.includes('node_modules')
);

let totalValidationStmts = 0;
let coveredValidationStmts = 0;

validation.forEach((filePath) => {
  const cov = data[filePath];
  const stmts = cov.s;
  const total = Object.keys(stmts).length;
  const covered = Object.values(stmts).filter((v: number) => v > 0).length;
  const pct = total > 0 ? ((covered / total) * 100).toFixed(2) : '0.00';

  totalValidationStmts += total;
  coveredValidationStmts += covered;

  const fileName = path.basename(filePath);
  const status = parseFloat(pct) >= 70 ? '✅' : '❌';
  console.log(`${status} ${fileName.padEnd(35)} ${pct}%`);
});

const validationPct =
  totalValidationStmts > 0
    ? ((coveredValidationStmts / totalValidationStmts) * 100).toFixed(2)
    : '0.00';
console.log('='.repeat(60));
console.log(`Overall Validation Coverage: ${validationPct}% (Target: 70%)`);

// Summary
console.log('\n📋 P0 Summary\n');
console.log('='.repeat(60));
console.log(`Services Layer:   ${servicesPct}% ${parseFloat(servicesPct) >= 70 ? '✅' : '❌'}`);
console.log(`Validation Layer: ${validationPct}% ${parseFloat(validationPct) >= 70 ? '✅' : '❌'}`);
console.log('='.repeat(60));

if (parseFloat(servicesPct) < 70 || parseFloat(validationPct) < 70) {
  console.log('\n⚠️  P0 coverage targets NOT met. Additional tests needed.');
  process.exit(1);
} else {
  console.log('\n✅ P0 coverage targets met!');
  process.exit(0);
}
