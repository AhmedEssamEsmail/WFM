#!/usr/bin/env tsx
/**
 * Generate Coverage Comment for Pull Requests
 *
 * Generates a formatted markdown comment with coverage summary,
 * delta, and file-level changes for posting to pull requests.
 *
 * Usage:
 *   tsx scripts/generate-coverage-comment.ts [--baseline <path>] [--output <path>]
 */

import * as fs from 'fs';
import * as path from 'path';

interface CoverageSummary {
  total: {
    lines: { pct: number; covered: number; total: number };
    statements: { pct: number; covered: number; total: number };
    functions: { pct: number; covered: number; total: number };
    branches: { pct: number; covered: number; total: number };
  };
  [key: string]: unknown;
}

/**
 * Load coverage summary from JSON file
 */
function loadCoverageSummary(filePath: string): CoverageSummary {
  const content = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(content);
}

/**
 * Calculate average coverage
 */
function calculateAverageCoverage(coverage: CoverageSummary): number {
  const { lines, statements, functions, branches } = coverage.total;
  return (lines.pct + statements.pct + functions.pct + branches.pct) / 4;
}

/**
 * Generate coverage badge
 */
function generateBadge(percentage: number): string {
  if (percentage >= 80) return '🟢';
  if (percentage >= 70) return '🟡';
  if (percentage >= 50) return '🟠';
  return '🔴';
}

/**
 * Generate coverage table
 */
function generateCoverageTable(coverage: CoverageSummary): string {
  const { lines, statements, functions, branches } = coverage.total;

  return `
| Metric | Coverage | Covered | Total |
|--------|----------|---------|-------|
| Lines | ${generateBadge(lines.pct)} ${lines.pct.toFixed(2)}% | ${lines.covered} | ${lines.total} |
| Statements | ${generateBadge(statements.pct)} ${statements.pct.toFixed(2)}% | ${statements.covered} | ${statements.total} |
| Functions | ${generateBadge(functions.pct)} ${functions.pct.toFixed(2)}% | ${functions.covered} | ${functions.total} |
| Branches | ${generateBadge(branches.pct)} ${branches.pct.toFixed(2)}% | ${branches.covered} | ${branches.total} |
`;
}

/**
 * Generate category coverage table
 */
function generateCategoryTable(coverage: CoverageSummary): string {
  const categories = {
    Services: 'src/services/',
    Components: 'src/components/',
    Utils: 'src/utils/',
    Contexts: 'src/contexts/',
  };

  let table = `
| Category | Coverage | Files |
|----------|----------|-------|
`;

  for (const [category, pathPrefix] of Object.entries(categories)) {
    const categoryFiles = Object.keys(coverage).filter((key) => key.startsWith(pathPrefix));

    if (categoryFiles.length === 0) continue;

    let totalLines = 0;
    let coveredLines = 0;

    for (const file of categoryFiles) {
      const fileCoverage = coverage[file];
      totalLines += fileCoverage.lines.total;
      coveredLines += fileCoverage.lines.covered;
    }

    const categoryPct = totalLines > 0 ? (coveredLines / totalLines) * 100 : 0;
    table += `| ${category} | ${generateBadge(categoryPct)} ${categoryPct.toFixed(2)}% | ${categoryFiles.length} |\n`;
  }

  return table;
}

/**
 * Generate delta section
 */
function generateDeltaSection(baseline: CoverageSummary, current: CoverageSummary): string {
  const baselineAvg = calculateAverageCoverage(baseline);
  const currentAvg = calculateAverageCoverage(current);
  const delta = currentAvg - baselineAvg;

  let deltaIcon = '➡️';
  let deltaText = 'No change';

  if (delta > 0) {
    deltaIcon = '📈';
    deltaText = `Increased by ${delta.toFixed(2)}%`;
  } else if (delta < 0) {
    deltaIcon = '📉';
    deltaText = `Decreased by ${Math.abs(delta).toFixed(2)}%`;
  }

  return `
## ${deltaIcon} Coverage Delta

${deltaText}

| Metric | Baseline | Current | Change |
|--------|----------|---------|--------|
| Lines | ${baseline.total.lines.pct.toFixed(2)}% | ${current.total.lines.pct.toFixed(2)}% | ${(current.total.lines.pct - baseline.total.lines.pct).toFixed(2)}% |
| Statements | ${baseline.total.statements.pct.toFixed(2)}% | ${current.total.statements.pct.toFixed(2)}% | ${(current.total.statements.pct - baseline.total.statements.pct).toFixed(2)}% |
| Functions | ${baseline.total.functions.pct.toFixed(2)}% | ${current.total.functions.pct.toFixed(2)}% | ${(current.total.functions.pct - baseline.total.functions.pct).toFixed(2)}% |
| Branches | ${baseline.total.branches.pct.toFixed(2)}% | ${current.total.branches.pct.toFixed(2)}% | ${(current.total.branches.pct - baseline.total.branches.pct).toFixed(2)}% |
`;
}

/**
 * Generate file changes section
 */
function generateFileChangesSection(baseline: CoverageSummary, current: CoverageSummary): string {
  const improved: string[] = [];
  const regressed: string[] = [];

  for (const file of Object.keys(current)) {
    if (file === 'total') continue;

    const currentPct = current[file].lines.pct;
    const baselinePct = baseline[file]?.lines.pct ?? 0;

    if (currentPct > baselinePct + 0.1) {
      improved.push(`- \`${file}\`: ${baselinePct.toFixed(1)}% → ${currentPct.toFixed(1)}%`);
    } else if (currentPct < baselinePct - 0.1) {
      regressed.push(`- \`${file}\`: ${baselinePct.toFixed(1)}% → ${currentPct.toFixed(1)}%`);
    }
  }

  let section = '';

  if (improved.length > 0) {
    section += `\n### ✨ Improved Files (${improved.length})\n\n`;
    section += improved.slice(0, 10).join('\n');
    if (improved.length > 10) {
      section += `\n\n<details><summary>Show ${improved.length - 10} more...</summary>\n\n`;
      section += improved.slice(10).join('\n');
      section += '\n</details>';
    }
  }

  if (regressed.length > 0) {
    section += `\n\n### ⚠️ Regressed Files (${regressed.length})\n\n`;
    section += regressed.slice(0, 10).join('\n');
    if (regressed.length > 10) {
      section += `\n\n<details><summary>Show ${regressed.length - 10} more...</summary>\n\n`;
      section += regressed.slice(10).join('\n');
      section += '\n</details>';
    }
  }

  return section;
}

/**
 * Generate full coverage comment
 */
function generateComment(current: CoverageSummary, baseline?: CoverageSummary): string {
  const avgCoverage = calculateAverageCoverage(current);

  let comment = `# 📊 Test Coverage Report\n\n`;
  comment += `**Overall Coverage:** ${generateBadge(avgCoverage)} ${avgCoverage.toFixed(2)}%\n\n`;

  comment += `## Coverage by Metric\n`;
  comment += generateCoverageTable(current);

  comment += `\n## Coverage by Category\n`;
  comment += generateCategoryTable(current);

  if (baseline) {
    comment += `\n${generateDeltaSection(baseline, current)}`;
    comment += `\n${generateFileChangesSection(baseline, current)}`;
  }

  comment += `\n\n---\n`;
  comment += `*Generated by coverage validation script*`;

  return comment;
}

/**
 * Main function
 */
function main() {
  const coveragePath = path.join(process.cwd(), 'coverage', 'coverage-summary.json');

  if (!fs.existsSync(coveragePath)) {
    console.error(`❌ Coverage file not found: ${coveragePath}`);
    process.exit(1);
  }

  const current = loadCoverageSummary(coveragePath);

  // Check for baseline
  const baselineArg = process.argv.indexOf('--baseline');
  let baseline: CoverageSummary | undefined;

  if (baselineArg !== -1 && process.argv[baselineArg + 1]) {
    const baselinePath = process.argv[baselineArg + 1];
    if (fs.existsSync(baselinePath)) {
      baseline = loadCoverageSummary(baselinePath);
    }
  }

  // Generate comment
  const comment = generateComment(current, baseline);

  // Output to file or stdout
  const outputArg = process.argv.indexOf('--output');
  if (outputArg !== -1 && process.argv[outputArg + 1]) {
    const outputPath = process.argv[outputArg + 1];
    fs.writeFileSync(outputPath, comment);
    console.log(`✅ Coverage comment written to ${outputPath}`);
  } else {
    console.log(comment);
  }
}

main();
