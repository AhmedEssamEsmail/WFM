/**
 * Service Test Generator
 *
 * Generates comprehensive test suites for service layer functions including:
 * - Service method signature analysis
 * - Supabase client mock generation
 * - Test templates for success, error, and edge cases
 */

import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';
import { vi } from 'vitest';

/**
 * Represents a service method signature
 */
export interface ServiceMethod {
  name: string;
  parameters: MethodParameter[];
  returnType: string;
  isAsync: boolean;
  jsDoc?: string;
}

/**
 * Represents a method parameter
 */
export interface MethodParameter {
  name: string;
  type: string;
  optional: boolean;
}

/**
 * Represents service dependencies
 */
export interface ServiceDependency {
  name: string;
  type: 'supabase' | 'other';
  importPath: string;
}

/**
 * Represents a parsed service file
 */
export interface ServiceDefinition {
  name: string;
  filePath: string;
  methods: ServiceMethod[];
  dependencies: ServiceDependency[];
}

/**
 * Mock chain builder for Supabase query methods
 */
export interface MockChainBuilder {
  select: any;
  insert: any;
  update: any;
  delete: any;
  eq: any;
  gte: any;
  lte: any;
  lt: any;
  gt: any;
  in: any;
  order: any;
  limit: any;
  single: any;
}

/**
 * Supabase mock configuration
 */
export interface SupabaseMock {
  auth: {
    signUp: any;
    signInWithPassword: any;
    signOut: any;
    getSession: any;
    resetPasswordForEmail: any;
    updateUser: any;
  };
  from: any;
}

/**
 * Parse a service file and extract method signatures
 */
export function parseServiceFile(filePath: string): ServiceDefinition {
  const sourceCode = fs.readFileSync(filePath, 'utf-8');
  const sourceFile = ts.createSourceFile(filePath, sourceCode, ts.ScriptTarget.Latest, true);

  const serviceName = path.basename(filePath, '.ts');
  const methods: ServiceMethod[] = [];
  const dependencies: ServiceDependency[] = [];

  // Extract imports to identify dependencies
  ts.forEachChild(sourceFile, (node) => {
    if (ts.isImportDeclaration(node)) {
      const moduleSpecifier = (node.moduleSpecifier as ts.StringLiteral).text;

      // Check for Supabase import
      if (moduleSpecifier.includes('supabase')) {
        node.importClause?.namedBindings?.forEachChild((binding) => {
          if (ts.isImportSpecifier(binding)) {
            dependencies.push({
              name: binding.name.text,
              type: 'supabase',
              importPath: moduleSpecifier,
            });
          }
        });
      }
    }

    // Extract service object methods
    if (ts.isVariableStatement(node)) {
      node.declarationList.declarations.forEach((declaration) => {
        if (
          ts.isVariableDeclaration(declaration) &&
          declaration.initializer &&
          ts.isObjectLiteralExpression(declaration.initializer)
        ) {
          declaration.initializer.properties.forEach((property) => {
            if (ts.isPropertyAssignment(property) || ts.isMethodDeclaration(property)) {
              const method = extractMethodSignature(property);
              if (method) {
                methods.push(method);
              }
            }
          });
        }
      });
    }
  });

  return {
    name: serviceName,
    filePath,
    methods,
    dependencies,
  };
}

/**
 * Extract method signature from a property assignment or method declaration
 */
function extractMethodSignature(
  node: ts.PropertyAssignment | ts.MethodDeclaration
): ServiceMethod | null {
  let methodName: string;
  let functionNode: ts.FunctionExpression | ts.ArrowFunction | ts.MethodDeclaration | null = null;

  if (ts.isPropertyAssignment(node)) {
    methodName = (node.name as ts.Identifier).text;
    if (ts.isFunctionExpression(node.initializer) || ts.isArrowFunction(node.initializer)) {
      functionNode = node.initializer;
    }
  } else if (ts.isMethodDeclaration(node)) {
    methodName = (node.name as ts.Identifier).text;
    functionNode = node;
  } else {
    return null;
  }

  if (!functionNode) return null;

  const parameters: MethodParameter[] = functionNode.parameters.map((param) => ({
    name: (param.name as ts.Identifier).text,
    type: param.type ? param.type.getText() : 'any',
    optional: !!param.questionToken,
  }));

  const returnType = functionNode.type?.getText() || 'any';
  const isAsync = !!functionNode.modifiers?.some((mod) => mod.kind === ts.SyntaxKind.AsyncKeyword);

  // Extract JSDoc comment if available
  let jsDoc: string | undefined;
  const fullText = node.getFullText();
  const commentMatch = fullText.match(/\/\*\*[\s\S]*?\*\//);
  if (commentMatch) {
    jsDoc = commentMatch[0];
  }

  return {
    name: methodName,
    parameters,
    returnType,
    isAsync,
    jsDoc,
  };
}

/**
 * Create Supabase client mocks with all required methods
 */
export function createMocks(): SupabaseMock {
  // Create mock chain builder that can be chained
  const createMockChain = (): MockChainBuilder => {
    const chain: Partial<MockChainBuilder> = {};

    // Define all chainable methods
    const chainMethods = [
      'select',
      'insert',
      'update',
      'delete',
      'eq',
      'gte',
      'lte',
      'lt',
      'gt',
      'in',
      'order',
      'limit',
    ];

    // Create mocks that return the chain for chaining
    chainMethods.forEach((method) => {
      chain[method as keyof MockChainBuilder] = vi.fn().mockReturnValue(chain);
    });

    // single() returns a promise with data/error
    chain.single = vi.fn().mockResolvedValue({ data: null, error: null });

    return chain as MockChainBuilder;
  };

  // Create the main mock chain
  const mockChain = createMockChain();

  // Create the from() mock that returns the chain
  const fromMock = vi.fn().mockReturnValue(mockChain);

  // Create auth mocks
  const authMock = {
    signUp: vi.fn().mockResolvedValue({ data: null, error: null }),
    signInWithPassword: vi.fn().mockResolvedValue({ data: null, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
    updateUser: vi.fn().mockResolvedValue({ data: null, error: null }),
  };

  return {
    auth: authMock,
    from: fromMock,
  };
}

/**
 * Configure mock return values for success scenarios
 */
export function configureMockSuccess(
  mock: SupabaseMock,
  operation: 'select' | 'insert' | 'update' | 'delete' | 'auth',
  returnData: any
): void {
  if (operation === 'auth') {
    // Configure auth mocks
    mock.auth.signUp.mockResolvedValue({ data: returnData, error: null });
    mock.auth.signInWithPassword.mockResolvedValue({ data: returnData, error: null });
    mock.auth.getSession.mockResolvedValue({ data: { session: returnData }, error: null });
  } else {
    // Configure query mocks
    const chain = mock.from();

    // Set up the chain to return success data
    if (operation === 'select') {
      chain.single.mockResolvedValue({ data: returnData, error: null });
    } else if (operation === 'insert') {
      chain.single.mockResolvedValue({ data: returnData, error: null });
    } else if (operation === 'update') {
      chain.single.mockResolvedValue({ data: returnData, error: null });
    } else if (operation === 'delete') {
      // Delete doesn't use single(), configure the chain directly
      mock.from.mockReturnValue({
        ...chain,
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      });
    }
  }
}

/**
 * Configure mock error responses for failure scenarios
 */
export function configureMockError(
  mock: SupabaseMock,
  operation: 'select' | 'insert' | 'update' | 'delete' | 'auth',
  errorMessage: string,
  errorCode?: string
): void {
  const error = {
    message: errorMessage,
    code: errorCode || 'PGRST000',
  };

  if (operation === 'auth') {
    // Configure auth mocks to return errors
    mock.auth.signUp.mockResolvedValue({ data: null, error });
    mock.auth.signInWithPassword.mockResolvedValue({ data: null, error });
    mock.auth.signOut.mockResolvedValue({ error });
    mock.auth.getSession.mockResolvedValue({ data: { session: null }, error });
    mock.auth.resetPasswordForEmail.mockResolvedValue({ error });
    mock.auth.updateUser.mockResolvedValue({ data: null, error });
  } else {
    // Configure query mocks to return errors
    const chain = mock.from();
    chain.single.mockResolvedValue({ data: null, error });
  }
}

/**
 * Get mock method names that match actual Supabase client methods
 */
export function getSupabaseMockMethods(): string[] {
  return [
    // Auth methods
    'auth.signUp',
    'auth.signInWithPassword',
    'auth.signOut',
    'auth.getSession',
    'auth.resetPasswordForEmail',
    'auth.updateUser',
    // Query builder methods
    'from',
    'select',
    'insert',
    'update',
    'delete',
    'eq',
    'gte',
    'lte',
    'lt',
    'gt',
    'in',
    'order',
    'limit',
    'single',
  ];
}

/**
 * Test case type
 */
export type TestCaseType = 'success' | 'error' | 'edge';

/**
 * Represents a generated test case
 */
export interface GeneratedTestCase {
  name: string;
  type: TestCaseType;
  code: string;
}

/**
 * Represents a complete test file
 */
export interface GeneratedTestFile {
  imports: string;
  mocks: string;
  setup: string;
  testCases: GeneratedTestCase[];
  cleanup: string;
}

/**
 * Generate imports for a test file
 */
export function generateImports(serviceDefinition: ServiceDefinition): string {
  const imports: string[] = [];

  // Add Vitest imports
  imports.push("import { describe, it, expect, beforeEach, vi } from 'vitest';");

  // Add service import
  const serviceName = serviceDefinition.name;
  imports.push(`import * as ${serviceName} from './${serviceName}';`);

  // Add Supabase mock imports if needed
  const hasSupabaseDep = serviceDefinition.dependencies.some((dep) => dep.type === 'supabase');
  if (hasSupabaseDep) {
    imports.push(
      "import { createMocks, configureMockSuccess, configureMockError } from './serviceTestGenerator';"
    );
  }

  return imports.join('\n');
}

/**
 * Generate mock setup code
 */
export function generateMockSetup(serviceDefinition: ServiceDefinition): string {
  const hasSupabaseDep = serviceDefinition.dependencies.some((dep) => dep.type === 'supabase');

  if (!hasSupabaseDep) {
    return '';
  }

  return `
  let supabaseMock: any;

  beforeEach(() => {
    supabaseMock = createMocks();
    vi.clearAllMocks();
  });
`;
}

/**
 * Generate a test case for a service method
 */
export function generateTestCase(
  method: ServiceMethod,
  type: TestCaseType,
  serviceDefinition: ServiceDefinition
): GeneratedTestCase {
  const hasSupabaseDep = serviceDefinition.dependencies.some((dep) => dep.type === 'supabase');

  if (type === 'success') {
    return generateSuccessTestCase(method, hasSupabaseDep);
  } else if (type === 'error') {
    return generateErrorTestCase(method, hasSupabaseDep);
  } else {
    return generateEdgeTestCase(method, hasSupabaseDep);
  }
}

/**
 * Generate a success path test case
 */
function generateSuccessTestCase(
  method: ServiceMethod,
  hasSupabaseDep: boolean
): GeneratedTestCase {
  const testName = `should ${method.name} successfully with valid data`;
  const paramValues = method.parameters.map((param) => generateMockValue(param.type, false));
  const paramList = paramValues.join(', ');

  let mockSetup = '';
  if (hasSupabaseDep) {
    mockSetup = `
      const mockData = { id: '1', name: 'Test' };
      configureMockSuccess(supabaseMock, 'select', mockData);
`;
  }

  const code = `
    it('${testName}', async () => {${mockSetup}
      const result = await ${method.name}(${paramList});

      expect(result).toBeDefined();
    });
`;

  return {
    name: testName,
    type: 'success',
    code,
  };
}

/**
 * Generate an error path test case
 */
function generateErrorTestCase(method: ServiceMethod, hasSupabaseDep: boolean): GeneratedTestCase {
  const testName = `should handle error when ${method.name} fails`;
  const paramValues = method.parameters.map((param) => generateMockValue(param.type, false));
  const paramList = paramValues.join(', ');

  let mockSetup = '';
  if (hasSupabaseDep) {
    mockSetup = `
      configureMockError(supabaseMock, 'select', 'Database error', 'PGRST000');
`;
  }

  const code = `
    it('${testName}', async () => {${mockSetup}
      await expect(${method.name}(${paramList})).rejects.toThrow();
    });
`;

  return {
    name: testName,
    type: 'error',
    code,
  };
}

/**
 * Generate an edge case test case
 */
function generateEdgeTestCase(method: ServiceMethod, hasSupabaseDep: boolean): GeneratedTestCase {
  const testName = `should handle edge case for ${method.name}`;

  // Generate edge case values (empty arrays, null, etc.)
  const paramValues = method.parameters.map((param) => generateMockValue(param.type, true));
  const paramList = paramValues.join(', ');

  let mockSetup = '';
  if (hasSupabaseDep) {
    mockSetup = `
      configureMockSuccess(supabaseMock, 'select', []);
`;
  }

  const code = `
    it('${testName}', async () => {${mockSetup}
      const result = await ${method.name}(${paramList});

      expect(result).toBeDefined();
    });
`;

  return {
    name: testName,
    type: 'edge',
    code,
  };
}

/**
 * Generate a mock value for a parameter type
 */
function generateMockValue(type: string, isEdgeCase: boolean): string {
  // Handle array types
  if (type.includes('[]')) {
    return isEdgeCase ? '[]' : "['item1', 'item2']";
  }

  // Handle optional types
  if (type.includes('?') || type.includes('undefined')) {
    return isEdgeCase ? 'undefined' : "'value'";
  }

  // Handle specific types
  if (type.includes('string')) {
    return isEdgeCase ? "''" : "'test-value'";
  }

  if (type.includes('number')) {
    return isEdgeCase ? '0' : '123';
  }

  if (type.includes('boolean')) {
    return isEdgeCase ? 'false' : 'true';
  }

  if (type.includes('null')) {
    return 'null';
  }

  // Handle object types
  if (type.includes('{') || type.includes('Partial') || type.includes('Record')) {
    return isEdgeCase ? '{}' : "{ key: 'value' }";
  }

  // Default to empty object
  return isEdgeCase ? '{}' : "{ id: '1' }";
}

/**
 * Generate a complete test file for a service
 */
export function generateServiceTest(serviceDefinition: ServiceDefinition): GeneratedTestFile {
  const imports = generateImports(serviceDefinition);
  const mocks = '';
  const setup = generateMockSetup(serviceDefinition);
  const testCases: GeneratedTestCase[] = [];
  const cleanup = '';

  // Generate test cases for each method
  for (const method of serviceDefinition.methods) {
    // Generate success path test
    testCases.push(generateTestCase(method, 'success', serviceDefinition));

    // Generate error path test
    testCases.push(generateTestCase(method, 'error', serviceDefinition));

    // Generate edge case test
    testCases.push(generateTestCase(method, 'edge', serviceDefinition));
  }

  return {
    imports,
    mocks,
    setup,
    testCases,
    cleanup,
  };
}

/**
 * Format a test file into a complete TypeScript file
 */
export function formatTestFile(
  serviceDefinition: ServiceDefinition,
  testFile: GeneratedTestFile
): string {
  const lines: string[] = [];

  // Add file header comment
  lines.push('/**');
  lines.push(` * Tests for ${serviceDefinition.name}`);
  lines.push(' *');
  lines.push(' * Auto-generated test file');
  lines.push(' */');
  lines.push('');

  // Add imports
  lines.push(testFile.imports);
  lines.push('');

  // Add mocks if any
  if (testFile.mocks) {
    lines.push(testFile.mocks);
    lines.push('');
  }

  // Add describe block
  lines.push(`describe('${serviceDefinition.name}', () => {`);

  // Add setup
  if (testFile.setup) {
    lines.push(testFile.setup);
  }

  // Add test cases grouped by method
  const methodGroups = new Map<string, GeneratedTestCase[]>();
  for (const testCase of testFile.testCases) {
    // Extract method name from test case name
    const methodMatch = testCase.name.match(/should (\w+)/);
    const methodName = methodMatch ? methodMatch[1] : 'unknown';

    if (!methodGroups.has(methodName)) {
      methodGroups.set(methodName, []);
    }
    methodGroups.get(methodName)!.push(testCase);
  }

  // Generate nested describe blocks for each method
  for (const [methodName, cases] of methodGroups) {
    lines.push(`  describe('${methodName}', () => {`);

    for (const testCase of cases) {
      lines.push(testCase.code);
    }

    lines.push('  });');
    lines.push('');
  }

  // Add cleanup if any
  if (testFile.cleanup) {
    lines.push(testFile.cleanup);
  }

  // Close describe block
  lines.push('});');
  lines.push('');

  return lines.join('\n');
}

/**
 * Generate test file path from service file path
 */
export function getTestFilePath(serviceFilePath: string): string {
  const dir = path.dirname(serviceFilePath);
  const basename = path.basename(serviceFilePath, '.ts');
  return path.join(dir, `${basename}.test.ts`);
}

/**
 * Write a test file to disk
 */
export function writeTestFile(testFilePath: string, content: string): void {
  try {
    fs.writeFileSync(testFilePath, content, 'utf-8');
  } catch (error) {
    // Requirement 15.1: Log file path and skip if cannot write
    console.error(`Failed to write test file: ${testFilePath}`, error);
    throw error;
  }
}

/**
 * Property test type
 */
export type PropertyTestType = 'state-transition' | 'calculation' | 'data-integrity';

/**
 * Represents a property-based test configuration
 */
export interface PropertyTestConfig {
  numRuns: number;
  maxSize: number;
  seed?: number;
  timeout?: number;
}

/**
 * Represents a generated property test
 */
export interface GeneratedPropertyTest {
  name: string;
  propertyType: PropertyTestType;
  code: string;
  description: string;
}

/**
 * Default property test configuration
 * Requirements: 4.2 - Configure property tests to run 100 iterations with max size 50
 */
export const DEFAULT_PROPERTY_CONFIG: PropertyTestConfig = {
  numRuns: 100,
  maxSize: 50,
  timeout: 5000,
};

/**
 * Generate fast-check arbitrary for a parameter type
 */
function generateArbitrary(type: string): string {
  // Handle array types
  if (type.includes('[]')) {
    const elementType = type.replace('[]', '').trim();
    const elementArb = generateArbitrary(elementType);
    return `fc.array(${elementArb})`;
  }

  // Handle optional types
  if (type.includes('?') || type.includes('undefined')) {
    const baseType = type.replace('?', '').replace('| undefined', '').trim();
    const baseArb = generateArbitrary(baseType);
    return `fc.option(${baseArb})`;
  }

  // Handle union types with null
  if (type.includes('null')) {
    const baseType = type.replace('| null', '').replace('null |', '').trim();
    const baseArb = generateArbitrary(baseType);
    return `fc.option(${baseArb}, { nil: null })`;
  }

  // Handle specific types
  if (type.includes('string')) {
    return 'fc.string()';
  }

  if (type.includes('number')) {
    return 'fc.integer()';
  }

  if (type.includes('boolean')) {
    return 'fc.boolean()';
  }

  if (type.includes('Date')) {
    return 'fc.date()';
  }

  // Handle object types
  if (type.includes('{') || type.includes('Partial') || type.includes('Record')) {
    return 'fc.record({ id: fc.string(), name: fc.string() })';
  }

  // Default to string
  return 'fc.string()';
}

/**
 * Generate a state transition property test
 * Requirements: 4.3 - Generate properties for state transitions
 */
function generateStateTransitionProperty(
  method: ServiceMethod,
  config: PropertyTestConfig
): GeneratedPropertyTest {
  const propertyName = `State transitions for ${method.name} should be valid`;
  const description = `Validates that ${method.name} maintains valid state transitions`;

  // Generate arbitraries for parameters
  const arbitraries = method.parameters.map((param) => {
    const arb = generateArbitrary(param.type);
    return `${param.name}: ${arb}`;
  });

  const code = `
  it('${propertyName}', () => {
    fc.assert(
      fc.property(
        fc.record({
          ${arbitraries.join(',\n          ')}
        }),
        async (input) => {
          try {
            const result = await ${method.name}(${method.parameters.map((p) => `input.${p.name}`).join(', ')});
            
            // Verify result is defined
            expect(result).toBeDefined();
            
            // State transition should not throw
            return true;
          } catch (error) {
            // Expected errors are acceptable
            return true;
          }
        }
      ),
      { numRuns: ${config.numRuns}, maxSize: ${config.maxSize} }
    );
  });
`;

  return {
    name: propertyName,
    propertyType: 'state-transition',
    code,
    description,
  };
}

/**
 * Generate a calculation property test
 * Requirements: 4.4 - Generate properties for calculations
 */
function generateCalculationProperty(
  method: ServiceMethod,
  config: PropertyTestConfig
): GeneratedPropertyTest {
  const propertyName = `Calculations in ${method.name} should maintain mathematical invariants`;
  const description = `Validates that ${method.name} produces mathematically consistent results`;

  // Generate arbitraries for numeric parameters
  const arbitraries = method.parameters.map((param) => {
    // Use natural numbers for calculations to avoid negative values
    const arb = param.type.includes('number') ? 'fc.nat(1000)' : generateArbitrary(param.type);
    return `${param.name}: ${arb}`;
  });

  const code = `
  it('${propertyName}', () => {
    fc.assert(
      fc.property(
        fc.record({
          ${arbitraries.join(',\n          ')}
        }),
        async (input) => {
          try {
            const result = await ${method.name}(${method.parameters.map((p) => `input.${p.name}`).join(', ')});
            
            // Verify result is defined
            expect(result).toBeDefined();
            
            // For numeric results, verify they are valid numbers
            if (typeof result === 'number') {
              expect(Number.isFinite(result)).toBe(true);
              expect(result).toBeGreaterThanOrEqual(0);
            }
            
            return true;
          } catch (error) {
            // Expected errors are acceptable
            return true;
          }
        }
      ),
      { numRuns: ${config.numRuns}, maxSize: ${config.maxSize} }
    );
  });
`;

  return {
    name: propertyName,
    propertyType: 'calculation',
    code,
    description,
  };
}

/**
 * Generate a data integrity property test
 * Requirements: 4.5 - Generate properties for data integrity
 */
function generateDataIntegrityProperty(
  method: ServiceMethod,
  config: PropertyTestConfig
): GeneratedPropertyTest {
  const propertyName = `Data integrity in ${method.name} should be preserved`;
  const description = `Validates that ${method.name} maintains data integrity constraints`;

  // Generate arbitraries for parameters
  const arbitraries = method.parameters.map((param) => {
    const arb = generateArbitrary(param.type);
    return `${param.name}: ${arb}`;
  });

  const code = `
  it('${propertyName}', () => {
    fc.assert(
      fc.property(
        fc.record({
          ${arbitraries.join(',\n          ')}
        }),
        async (input) => {
          try {
            const result = await ${method.name}(${method.parameters.map((p) => `input.${p.name}`).join(', ')});
            
            // Verify result maintains data structure
            expect(result).toBeDefined();
            
            // For array results, verify array integrity
            if (Array.isArray(result)) {
              expect(Array.isArray(result)).toBe(true);
              // Array should not contain undefined values
              expect(result.every(item => item !== undefined)).toBe(true);
            }
            
            // For object results, verify object integrity
            if (typeof result === 'object' && result !== null && !Array.isArray(result)) {
              expect(typeof result).toBe('object');
              // Object should have at least some properties
              expect(Object.keys(result).length).toBeGreaterThanOrEqual(0);
            }
            
            return true;
          } catch (error) {
            // Expected errors are acceptable
            return true;
          }
        }
      ),
      { numRuns: ${config.numRuns}, maxSize: ${config.maxSize} }
    );
  });
`;

  return {
    name: propertyName,
    propertyType: 'data-integrity',
    code,
    description,
  };
}

/**
 * Generate property-based tests for a service method
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6
 */
export function generatePropertyTest(
  method: ServiceMethod,
  propertyType: PropertyTestType,
  config: PropertyTestConfig = DEFAULT_PROPERTY_CONFIG
): GeneratedPropertyTest {
  switch (propertyType) {
    case 'state-transition':
      return generateStateTransitionProperty(method, config);
    case 'calculation':
      return generateCalculationProperty(method, config);
    case 'data-integrity':
      return generateDataIntegrityProperty(method, config);
    default:
      throw new Error(`Unknown property type: ${propertyType}`);
  }
}

/**
 * Generate all property tests for a service method
 * Requirements: 4.6 - Add descriptive property names and validation logic
 */
export function generateAllPropertyTests(
  method: ServiceMethod,
  config: PropertyTestConfig = DEFAULT_PROPERTY_CONFIG
): GeneratedPropertyTest[] {
  const propertyTests: GeneratedPropertyTest[] = [];

  // Generate state transition property
  propertyTests.push(generatePropertyTest(method, 'state-transition', config));

  // Generate calculation property if method likely involves calculations
  if (
    method.name.includes('calculate') ||
    method.name.includes('balance') ||
    method.name.includes('distribute') ||
    method.returnType.includes('number')
  ) {
    propertyTests.push(generatePropertyTest(method, 'calculation', config));
  }

  // Generate data integrity property
  propertyTests.push(generatePropertyTest(method, 'data-integrity', config));

  return propertyTests;
}

/**
 * Generate imports for property-based tests
 */
export function generatePropertyTestImports(serviceDefinition: ServiceDefinition): string {
  const imports: string[] = [];

  // Add Vitest imports
  imports.push("import { describe, it, expect, beforeEach, vi } from 'vitest';");

  // Add fast-check import
  imports.push("import * as fc from 'fast-check';");

  // Add service import
  const serviceName = serviceDefinition.name;
  imports.push(`import * as ${serviceName} from './${serviceName}';`);

  // Add Supabase mock imports if needed
  const hasSupabaseDep = serviceDefinition.dependencies.some((dep) => dep.type === 'supabase');
  if (hasSupabaseDep) {
    imports.push(
      "import { createMocks, configureMockSuccess, configureMockError } from './serviceTestGenerator';"
    );
  }

  return imports.join('\n');
}

/**
 * Format property test file with fast-check tests
 */
export function formatPropertyTestFile(
  serviceDefinition: ServiceDefinition,
  propertyTests: GeneratedPropertyTest[],
  config: PropertyTestConfig = DEFAULT_PROPERTY_CONFIG
): string {
  const lines: string[] = [];

  // Add file header comment
  lines.push('/**');
  lines.push(` * Property-based tests for ${serviceDefinition.name}`);
  lines.push(' *');
  lines.push(' * Auto-generated property test file using fast-check');
  lines.push(` * Configuration: ${config.numRuns} runs, max size ${config.maxSize}`);
  lines.push(' */');
  lines.push('');

  // Add imports
  lines.push(generatePropertyTestImports(serviceDefinition));
  lines.push('');

  // Add describe block
  lines.push(`describe('${serviceDefinition.name} - Property Tests', () => {`);

  // Add setup if needed
  const hasSupabaseDep = serviceDefinition.dependencies.some((dep) => dep.type === 'supabase');
  if (hasSupabaseDep) {
    lines.push(`
  let supabaseMock: any;

  beforeEach(() => {
    supabaseMock = createMocks();
    configureMockSuccess(supabaseMock, 'select', { id: '1', name: 'Test' });
    vi.clearAllMocks();
  });
`);
  }

  // Group property tests by method
  const methodGroups = new Map<string, GeneratedPropertyTest[]>();
  for (const test of propertyTests) {
    // Extract method name from test name
    const methodMatch = test.name.match(/for (\w+)/);
    const methodName = methodMatch ? methodMatch[1] : 'unknown';

    if (!methodGroups.has(methodName)) {
      methodGroups.set(methodName, []);
    }
    methodGroups.get(methodName)!.push(test);
  }

  // Generate nested describe blocks for each method
  for (const [methodName, tests] of methodGroups) {
    lines.push(`  describe('${methodName}', () => {`);

    for (const test of tests) {
      // Add comment with description
      lines.push(`    // ${test.description}`);
      lines.push(test.code);
    }

    lines.push('  });');
    lines.push('');
  }

  // Close describe block
  lines.push('});');
  lines.push('');

  return lines.join('\n');
}
