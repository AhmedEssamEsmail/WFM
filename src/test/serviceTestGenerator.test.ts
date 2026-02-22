/**
 * Tests for Service Test Generator
 *
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 14.1, 14.2, 14.3, 14.4, 14.5, 15.1, 15.2, 15.3, 15.4, 15.5
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  parseServiceFile,
  createMocks,
  configureMockSuccess,
  configureMockError,
  getSupabaseMockMethods,
  generateServiceTest,
  generateImports,
  generateMockSetup,
  generateTestCase,
  formatTestFile,
  getTestFilePath,
  generatePropertyTest,
  generateAllPropertyTests,
  generatePropertyTestImports,
  formatPropertyTestFile,
  DEFAULT_PROPERTY_CONFIG,
  type ServiceDefinition,
  type SupabaseMock,
  type ServiceMethod,
} from './serviceTestGenerator';

// Mock the fs module
vi.mock('fs', () => ({
  readFileSync: vi.fn(),
}));

// Import fs after mocking
import * as fs from 'fs';

describe('Service Test Generator', () => {
  describe('parseServiceFile', () => {
    it('should parse service file and extract method signatures', () => {
      // Requirement 3.1: Analyze service method signatures
      const mockServiceCode = `
        import { supabase } from '../lib/supabase';
        
        export const testService = {
          async getItems(): Promise<any[]> {
            const { data, error } = await supabase.from('items').select('*');
            if (error) throw error;
            return data;
          },
          
          async createItem(name: string, value: number): Promise<any> {
            const { data, error } = await supabase.from('items').insert({ name, value }).select().single();
            if (error) throw error;
            return data;
          }
        };
      `;

      (fs.readFileSync as any).mockReturnValue(mockServiceCode);

      const result = parseServiceFile('/test/testService.ts');

      expect(result.name).toBe('testService');
      expect(result.methods).toHaveLength(2);
      expect(result.methods[0].name).toBe('getItems');
      expect(result.methods[0].isAsync).toBe(true);
      expect(result.methods[1].name).toBe('createItem');
      expect(result.methods[1].parameters).toHaveLength(2);
    });

    it('should identify Supabase dependencies', () => {
      // Requirement 10.1: Identify service dependencies
      const mockServiceCode = `
        import { supabase } from '../lib/supabase';
        import { validateInput } from '../utils/validation';
        
        export const testService = {
          async getData() {
            return await supabase.from('data').select('*');
          }
        };
      `;

      (fs.readFileSync as any).mockReturnValue(mockServiceCode);

      const result = parseServiceFile('/test/testService.ts');

      expect(result.dependencies).toHaveLength(1);
      expect(result.dependencies[0].name).toBe('supabase');
      expect(result.dependencies[0].type).toBe('supabase');
    });

    it('should extract method parameters with types', () => {
      // Requirement 3.1: Extract method signatures with parameter types
      const mockServiceCode = `
        import { supabase } from '../lib/supabase';
        
        export const testService = {
          async updateItem(id: string, updates: Partial<Item>, force?: boolean): Promise<Item> {
            const { data, error } = await supabase.from('items').update(updates).eq('id', id).single();
            if (error) throw error;
            return data;
          }
        };
      `;

      (fs.readFileSync as any).mockReturnValue(mockServiceCode);

      const result = parseServiceFile('/test/testService.ts');

      expect(result.methods[0].parameters).toHaveLength(3);
      expect(result.methods[0].parameters[0]).toEqual({
        name: 'id',
        type: 'string',
        optional: false,
      });
      expect(result.methods[0].parameters[2]).toEqual({
        name: 'force',
        type: 'boolean',
        optional: true,
      });
    });

    it('should handle services with no methods', () => {
      // Requirement 15.2: Handle services with no exported functions
      const mockServiceCode = `
        import { supabase } from '../lib/supabase';
        
        export const emptyService = {};
      `;

      (fs.readFileSync as any).mockReturnValue(mockServiceCode);

      const result = parseServiceFile('/test/emptyService.ts');

      expect(result.methods).toHaveLength(0);
    });
  });

  describe('createMocks', () => {
    let mocks: SupabaseMock;

    beforeEach(() => {
      mocks = createMocks();
    });

    it('should create Supabase client mock with auth methods', () => {
      // Requirement 10.2: Create Supabase mock with all required methods
      expect(mocks.auth).toBeDefined();
      expect(mocks.auth.signUp).toBeDefined();
      expect(mocks.auth.signInWithPassword).toBeDefined();
      expect(mocks.auth.signOut).toBeDefined();
      expect(mocks.auth.getSession).toBeDefined();
      expect(mocks.auth.resetPasswordForEmail).toBeDefined();
      expect(mocks.auth.updateUser).toBeDefined();
    });

    it('should create Supabase client mock with query methods', () => {
      // Requirement 10.3: Mock query methods (select, insert, update, delete)
      expect(mocks.from).toBeDefined();

      const chain = mocks.from('test_table');
      expect(chain.select).toBeDefined();
      expect(chain.insert).toBeDefined();
      expect(chain.update).toBeDefined();
      expect(chain.delete).toBeDefined();
    });

    it('should support method chaining for query builder', () => {
      // Requirement 10.3: Support chainable query methods
      const chain = mocks.from('test_table');

      const result = chain
        .select('*')
        .eq('id', '123')
        .order('created_at', { ascending: false })
        .limit(10);

      expect(result).toBeDefined();
      expect(chain.select).toHaveBeenCalledWith('*');
      expect(chain.eq).toHaveBeenCalledWith('id', '123');
      expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(chain.limit).toHaveBeenCalledWith(10);
    });

    it('should support single() method for single row queries', () => {
      // Requirement 10.3: Support single row query method
      const chain = mocks.from('test_table');

      const promise = chain.select('*').eq('id', '123').single();

      expect(promise).toBeInstanceOf(Promise);
    });

    it('should ensure mock method names match actual Supabase methods', () => {
      // Requirement 10.6: Mock method names match actual dependency methods
      const expectedMethods = getSupabaseMockMethods();

      // Verify auth methods
      expect(expectedMethods).toContain('auth.signUp');
      expect(expectedMethods).toContain('auth.signInWithPassword');
      expect(expectedMethods).toContain('auth.signOut');
      expect(expectedMethods).toContain('auth.getSession');

      // Verify query methods
      expect(expectedMethods).toContain('from');
      expect(expectedMethods).toContain('select');
      expect(expectedMethods).toContain('insert');
      expect(expectedMethods).toContain('update');
      expect(expectedMethods).toContain('delete');
      expect(expectedMethods).toContain('eq');
      expect(expectedMethods).toContain('single');
    });
  });

  describe('configureMockSuccess', () => {
    let mocks: SupabaseMock;

    beforeEach(() => {
      mocks = createMocks();
    });

    it('should configure mock for successful select operation', () => {
      // Requirement 10.4: Configure mock return values for success scenarios
      const testData = [{ id: '1', name: 'Test' }];

      configureMockSuccess(mocks, 'select', testData);

      const chain = mocks.from('test_table');
      return chain
        .select('*')
        .single()
        .then((result: any) => {
          expect(result.data).toEqual(testData);
          expect(result.error).toBeNull();
        });
    });

    it('should configure mock for successful insert operation', () => {
      // Requirement 10.4: Configure mock return values for success scenarios
      const testData = { id: '1', name: 'New Item' };

      configureMockSuccess(mocks, 'insert', testData);

      const chain = mocks.from('test_table');
      return chain
        .insert({ name: 'New Item' })
        .single()
        .then((result: any) => {
          expect(result.data).toEqual(testData);
          expect(result.error).toBeNull();
        });
    });

    it('should configure mock for successful update operation', () => {
      // Requirement 10.4: Configure mock return values for success scenarios
      const testData = { id: '1', name: 'Updated Item' };

      configureMockSuccess(mocks, 'update', testData);

      const chain = mocks.from('test_table');
      return chain
        .update({ name: 'Updated Item' })
        .eq('id', '1')
        .single()
        .then((result: any) => {
          expect(result.data).toEqual(testData);
          expect(result.error).toBeNull();
        });
    });

    it('should configure mock for successful delete operation', () => {
      // Requirement 10.4: Configure mock return values for success scenarios
      configureMockSuccess(mocks, 'delete', null);

      const chain = mocks.from('test_table');
      return chain
        .delete()
        .eq('id', '1')
        .then((result: any) => {
          expect(result.error).toBeNull();
        });
    });

    it('should configure mock for successful auth operation', () => {
      // Requirement 10.4: Configure mock return values for success scenarios
      const testData = { user: { id: '1', email: 'test@example.com' } };

      configureMockSuccess(mocks, 'auth', testData);

      return mocks.auth
        .signInWithPassword({ email: 'test@example.com', password: 'password' })
        .then((result: any) => {
          expect(result.data).toEqual(testData);
          expect(result.error).toBeNull();
        });
    });
  });

  describe('configureMockError', () => {
    let mocks: SupabaseMock;

    beforeEach(() => {
      mocks = createMocks();
    });

    it('should configure mock for failed select operation', () => {
      // Requirement 10.5: Configure mock error responses for failure scenarios
      configureMockError(mocks, 'select', 'Record not found', 'PGRST116');

      const chain = mocks.from('test_table');
      return chain
        .select('*')
        .eq('id', '999')
        .single()
        .then((result: any) => {
          expect(result.data).toBeNull();
          expect(result.error).toEqual({
            message: 'Record not found',
            code: 'PGRST116',
          });
        });
    });

    it('should configure mock for failed insert operation', () => {
      // Requirement 10.5: Configure mock error responses for failure scenarios
      configureMockError(mocks, 'insert', 'Duplicate key violation', 'PGRST409');

      const chain = mocks.from('test_table');
      return chain
        .insert({ name: 'Duplicate' })
        .single()
        .then((result: any) => {
          expect(result.data).toBeNull();
          expect(result.error).toEqual({
            message: 'Duplicate key violation',
            code: 'PGRST409',
          });
        });
    });

    it('should configure mock for failed update operation', () => {
      // Requirement 10.5: Configure mock error responses for failure scenarios
      configureMockError(mocks, 'update', 'Update failed', 'PGRST000');

      const chain = mocks.from('test_table');
      return chain
        .update({ name: 'Updated' })
        .eq('id', '1')
        .single()
        .then((result: any) => {
          expect(result.data).toBeNull();
          expect(result.error).toBeDefined();
          expect(result.error.message).toBe('Update failed');
        });
    });

    it('should configure mock for failed auth operation', () => {
      // Requirement 10.5: Configure mock error responses for failure scenarios
      configureMockError(mocks, 'auth', 'Invalid credentials', 'AUTH001');

      return mocks.auth
        .signInWithPassword({ email: 'test@example.com', password: 'wrong' })
        .then((result: any) => {
          expect(result.data).toBeNull();
          expect(result.error).toEqual({
            message: 'Invalid credentials',
            code: 'AUTH001',
          });
        });
    });

    it('should use default error code when not provided', () => {
      // Requirement 10.5: Configure mock error responses with default error code
      configureMockError(mocks, 'select', 'Generic error');

      const chain = mocks.from('test_table');
      return chain
        .select('*')
        .single()
        .then((result: any) => {
          expect(result.error).toEqual({
            message: 'Generic error',
            code: 'PGRST000',
          });
        });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty service file', () => {
      // Requirement 3.5: Handle edge cases including empty arrays
      const mockServiceCode = ``;

      (fs.readFileSync as any).mockReturnValue(mockServiceCode);

      const result = parseServiceFile('/test/emptyService.ts');

      expect(result.methods).toHaveLength(0);
      expect(result.dependencies).toHaveLength(0);
    });

    it('should handle service with only imports', () => {
      // Requirement 3.5: Handle edge cases
      const mockServiceCode = `
        import { supabase } from '../lib/supabase';
        import { validateInput } from '../utils/validation';
      `;

      (fs.readFileSync as any).mockReturnValue(mockServiceCode);

      const result = parseServiceFile('/test/importsOnly.ts');

      expect(result.methods).toHaveLength(0);
      expect(result.dependencies.length).toBeGreaterThan(0);
    });

    it('should handle methods with no parameters', () => {
      // Requirement 3.5: Handle edge cases
      const mockServiceCode = `
        import { supabase } from '../lib/supabase';
        
        export const testService = {
          async getAll() {
            return await supabase.from('items').select('*');
          }
        };
      `;

      (fs.readFileSync as any).mockReturnValue(mockServiceCode);

      const result = parseServiceFile('/test/testService.ts');

      expect(result.methods[0].parameters).toHaveLength(0);
    });

    it('should handle null values in mock configuration', () => {
      // Requirement 3.5: Handle edge cases including null values
      const mocks = createMocks();

      configureMockSuccess(mocks, 'select', null);

      const chain = mocks.from('test_table');
      return chain
        .select('*')
        .single()
        .then((result: any) => {
          expect(result.data).toBeNull();
          expect(result.error).toBeNull();
        });
    });
  });

  describe('generateImports', () => {
    it('should generate imports with Vitest and service', () => {
      // Requirement 3.7: Include all necessary imports
      const serviceDefinition: ServiceDefinition = {
        name: 'testService',
        filePath: '/test/testService.ts',
        methods: [],
        dependencies: [],
      };

      const imports = generateImports(serviceDefinition);

      expect(imports).toContain("import { describe, it, expect, beforeEach, vi } from 'vitest'");
      expect(imports).toContain("import * as testService from './testService'");
    });

    it('should include Supabase mock imports when service has Supabase dependency', () => {
      // Requirement 3.7: Include all necessary imports
      const serviceDefinition: ServiceDefinition = {
        name: 'testService',
        filePath: '/test/testService.ts',
        methods: [],
        dependencies: [
          {
            name: 'supabase',
            type: 'supabase',
            importPath: '../lib/supabase',
          },
        ],
      };

      const imports = generateImports(serviceDefinition);

      expect(imports).toContain('createMocks');
      expect(imports).toContain('configureMockSuccess');
      expect(imports).toContain('configureMockError');
    });
  });

  describe('generateMockSetup', () => {
    it('should generate mock setup for service with Supabase dependency', () => {
      // Requirement 3.7: Include mock setup
      const serviceDefinition: ServiceDefinition = {
        name: 'testService',
        filePath: '/test/testService.ts',
        methods: [],
        dependencies: [
          {
            name: 'supabase',
            type: 'supabase',
            importPath: '../lib/supabase',
          },
        ],
      };

      const setup = generateMockSetup(serviceDefinition);

      expect(setup).toContain('let supabaseMock');
      expect(setup).toContain('beforeEach');
      expect(setup).toContain('createMocks()');
      expect(setup).toContain('vi.clearAllMocks()');
    });

    it('should return empty string for service without Supabase dependency', () => {
      // Requirement 3.7: Handle services without Supabase
      const serviceDefinition: ServiceDefinition = {
        name: 'testService',
        filePath: '/test/testService.ts',
        methods: [],
        dependencies: [],
      };

      const setup = generateMockSetup(serviceDefinition);

      expect(setup).toBe('');
    });
  });

  describe('generateTestCase', () => {
    const serviceDefinition: ServiceDefinition = {
      name: 'testService',
      filePath: '/test/testService.ts',
      methods: [],
      dependencies: [
        {
          name: 'supabase',
          type: 'supabase',
          importPath: '../lib/supabase',
        },
      ],
    };

    it('should generate success path test case', () => {
      // Requirement 3.3: Create test cases for success paths with valid data
      const method = {
        name: 'getItems',
        parameters: [],
        returnType: 'Promise<any[]>',
        isAsync: true,
      };

      const testCase = generateTestCase(method, 'success', serviceDefinition);

      expect(testCase.type).toBe('success');
      expect(testCase.name).toContain('successfully');
      expect(testCase.code).toContain('it(');
      expect(testCase.code).toContain('expect(result).toBeDefined()');
    });

    it('should generate error path test case', () => {
      // Requirement 3.4: Create test cases for error paths with invalid data
      const method = {
        name: 'getItems',
        parameters: [],
        returnType: 'Promise<any[]>',
        isAsync: true,
      };

      const testCase = generateTestCase(method, 'error', serviceDefinition);

      expect(testCase.type).toBe('error');
      expect(testCase.name).toContain('error');
      expect(testCase.code).toContain('rejects.toThrow()');
    });

    it('should generate edge case test case', () => {
      // Requirement 3.5: Create test cases for edge cases including empty arrays and null values
      const method = {
        name: 'getItems',
        parameters: [],
        returnType: 'Promise<any[]>',
        isAsync: true,
      };

      const testCase = generateTestCase(method, 'edge', serviceDefinition);

      expect(testCase.type).toBe('edge');
      expect(testCase.name).toContain('edge case');
      expect(testCase.code).toContain('it(');
    });

    it('should handle methods with parameters', () => {
      // Requirement 3.3: Generate tests with method parameters
      const method = {
        name: 'createItem',
        parameters: [
          { name: 'name', type: 'string', optional: false },
          { name: 'value', type: 'number', optional: false },
        ],
        returnType: 'Promise<any>',
        isAsync: true,
      };

      const testCase = generateTestCase(method, 'success', serviceDefinition);

      expect(testCase.code).toContain('createItem(');
    });
  });

  describe('generateServiceTest', () => {
    it('should generate complete test file structure', () => {
      // Requirement 3.6: Produce syntactically valid TypeScript code
      const serviceDefinition: ServiceDefinition = {
        name: 'testService',
        filePath: '/test/testService.ts',
        methods: [
          {
            name: 'getItems',
            parameters: [],
            returnType: 'Promise<any[]>',
            isAsync: true,
          },
        ],
        dependencies: [
          {
            name: 'supabase',
            type: 'supabase',
            importPath: '../lib/supabase',
          },
        ],
      };

      const testFile = generateServiceTest(serviceDefinition);

      expect(testFile.imports).toBeDefined();
      expect(testFile.setup).toBeDefined();
      expect(testFile.testCases).toHaveLength(3); // success, error, edge
    });

    it('should generate test cases for all methods', () => {
      // Requirement 3.3, 3.4, 3.5: Generate tests for all service methods
      const serviceDefinition: ServiceDefinition = {
        name: 'testService',
        filePath: '/test/testService.ts',
        methods: [
          {
            name: 'getItems',
            parameters: [],
            returnType: 'Promise<any[]>',
            isAsync: true,
          },
          {
            name: 'createItem',
            parameters: [{ name: 'name', type: 'string', optional: false }],
            returnType: 'Promise<any>',
            isAsync: true,
          },
        ],
        dependencies: [],
      };

      const testFile = generateServiceTest(serviceDefinition);

      // Each method should have 3 test cases (success, error, edge)
      expect(testFile.testCases).toHaveLength(6);
    });
  });

  describe('formatTestFile', () => {
    it('should format test file with proper structure', () => {
      // Requirement 14.3: Include describe block with source file name
      const serviceDefinition: ServiceDefinition = {
        name: 'testService',
        filePath: '/test/testService.ts',
        methods: [
          {
            name: 'getItems',
            parameters: [],
            returnType: 'Promise<any[]>',
            isAsync: true,
          },
        ],
        dependencies: [],
      };

      const testFile = generateServiceTest(serviceDefinition);
      const formatted = formatTestFile(serviceDefinition, testFile);

      expect(formatted).toContain("describe('testService'");
      expect(formatted).toContain('import { describe, it, expect');
    });

    it('should group tests by method in nested describe blocks', () => {
      // Requirement 14.4: Group related tests within nested describe blocks
      const serviceDefinition: ServiceDefinition = {
        name: 'testService',
        filePath: '/test/testService.ts',
        methods: [
          {
            name: 'getItems',
            parameters: [],
            returnType: 'Promise<any[]>',
            isAsync: true,
          },
        ],
        dependencies: [],
      };

      const testFile = generateServiceTest(serviceDefinition);
      const formatted = formatTestFile(serviceDefinition, testFile);

      expect(formatted).toContain("describe('getItems'");
    });

    it('should produce valid TypeScript code', () => {
      // Requirement 3.6: Produce syntactically valid TypeScript code
      const serviceDefinition: ServiceDefinition = {
        name: 'testService',
        filePath: '/test/testService.ts',
        methods: [
          {
            name: 'getItems',
            parameters: [],
            returnType: 'Promise<any[]>',
            isAsync: true,
          },
        ],
        dependencies: [
          {
            name: 'supabase',
            type: 'supabase',
            importPath: '../lib/supabase',
          },
        ],
      };

      const testFile = generateServiceTest(serviceDefinition);
      const formatted = formatTestFile(serviceDefinition, testFile);

      // Basic syntax checks
      expect(formatted).toContain('import');
      expect(formatted).toContain('describe(');
      expect(formatted).toContain('it(');
      expect(formatted).toContain('expect(');

      // Check for balanced braces
      const openBraces = (formatted.match(/{/g) || []).length;
      const closeBraces = (formatted.match(/}/g) || []).length;
      expect(openBraces).toBe(closeBraces);

      // Check for balanced parentheses
      const openParens = (formatted.match(/\(/g) || []).length;
      const closeParens = (formatted.match(/\)/g) || []).length;
      expect(openParens).toBe(closeParens);
    });
  });

  describe('getTestFilePath', () => {
    it('should generate test file path with .test.ts suffix', () => {
      // Requirement 14.2: Name test file with pattern [source-name].test.ts
      const servicePath = '/src/services/authService.ts';
      const testPath = getTestFilePath(servicePath);

      expect(testPath).toContain('authService.test.ts');
    });

    it('should place test file in same directory as source', () => {
      // Requirement 14.1: Place test file in same directory as source file
      const servicePath = '/src/services/authService.ts';
      const testPath = getTestFilePath(servicePath);

      // Handle both forward and backward slashes (Windows vs Unix)
      expect(testPath.replace(/\\/g, '/')).toContain('/src/services/');
    });
  });

  describe('Property-Based Test Generation', () => {
    const testMethod: ServiceMethod = {
      name: 'calculateBalance',
      parameters: [
        { name: 'initial', type: 'number', optional: false },
        { name: 'deduction', type: 'number', optional: false },
      ],
      returnType: 'Promise<number>',
      isAsync: true,
    };

    const serviceDefinition: ServiceDefinition = {
      name: 'testService',
      filePath: '/test/testService.ts',
      methods: [testMethod],
      dependencies: [
        {
          name: 'supabase',
          type: 'supabase',
          importPath: '../lib/supabase',
        },
      ],
    };

    describe('generatePropertyTest', () => {
      it('should generate state transition property test', () => {
        // Requirement 4.3: Generate properties for state transitions
        const propertyTest = generatePropertyTest(testMethod, 'state-transition');

        expect(propertyTest.propertyType).toBe('state-transition');
        expect(propertyTest.name).toContain('State transitions');
        expect(propertyTest.code).toContain('fc.assert');
        expect(propertyTest.code).toContain('fc.property');
        expect(propertyTest.description).toContain('state transitions');
      });

      it('should generate calculation property test', () => {
        // Requirement 4.4: Generate properties for calculations
        const propertyTest = generatePropertyTest(testMethod, 'calculation');

        expect(propertyTest.propertyType).toBe('calculation');
        expect(propertyTest.name).toContain('Calculations');
        expect(propertyTest.name).toContain('mathematical invariants');
        expect(propertyTest.code).toContain('fc.assert');
        expect(propertyTest.code).toContain('Number.isFinite');
        expect(propertyTest.description).toContain('mathematically consistent');
      });

      it('should generate data integrity property test', () => {
        // Requirement 4.5: Generate properties for data integrity
        const propertyTest = generatePropertyTest(testMethod, 'data-integrity');

        expect(propertyTest.propertyType).toBe('data-integrity');
        expect(propertyTest.name).toContain('Data integrity');
        expect(propertyTest.code).toContain('fc.assert');
        expect(propertyTest.code).toContain('Array.isArray');
        expect(propertyTest.description).toContain('data integrity');
      });

      it('should configure property tests with 100 iterations and max size 50', () => {
        // Requirement 4.2: Configure property tests to run 100 iterations with max size 50
        const propertyTest = generatePropertyTest(testMethod, 'state-transition');

        expect(propertyTest.code).toContain('numRuns: 100');
        expect(propertyTest.code).toContain('maxSize: 50');
      });

      it('should use custom configuration when provided', () => {
        // Requirement 4.2: Support custom property test configuration
        const customConfig = {
          numRuns: 200,
          maxSize: 100,
          timeout: 10000,
        };

        const propertyTest = generatePropertyTest(testMethod, 'state-transition', customConfig);

        expect(propertyTest.code).toContain('numRuns: 200');
        expect(propertyTest.code).toContain('maxSize: 100');
      });

      it('should include descriptive property names', () => {
        // Requirement 4.6: Add descriptive property names
        const propertyTest = generatePropertyTest(testMethod, 'state-transition');

        expect(propertyTest.name).toBeTruthy();
        expect(propertyTest.name.length).toBeGreaterThan(10);
        expect(propertyTest.name).toContain(testMethod.name);
      });

      it('should include validation logic in property tests', () => {
        // Requirement 4.6: Add validation logic
        const propertyTest = generatePropertyTest(testMethod, 'calculation');

        expect(propertyTest.code).toContain('expect(');
        expect(propertyTest.code).toContain('toBeDefined()');
        expect(propertyTest.code).toContain('toBeGreaterThanOrEqual');
      });

      it('should throw error for unknown property type', () => {
        // Error handling for invalid property types
        expect(() => {
          generatePropertyTest(testMethod, 'invalid-type' as any);
        }).toThrow('Unknown property type');
      });
    });

    describe('generateAllPropertyTests', () => {
      it('should generate multiple property tests for a method', () => {
        // Requirement 4.3, 4.4, 4.5: Generate all property types
        const propertyTests = generateAllPropertyTests(testMethod);

        expect(propertyTests.length).toBeGreaterThanOrEqual(2);
        expect(propertyTests.some((t) => t.propertyType === 'state-transition')).toBe(true);
        expect(propertyTests.some((t) => t.propertyType === 'data-integrity')).toBe(true);
      });

      it('should include calculation property for calculation methods', () => {
        // Requirement 4.4: Generate calculation properties for calculation methods
        const calcMethod: ServiceMethod = {
          name: 'calculateBalance',
          parameters: [{ name: 'amount', type: 'number', optional: false }],
          returnType: 'Promise<number>',
          isAsync: true,
        };

        const propertyTests = generateAllPropertyTests(calcMethod);

        expect(propertyTests.some((t) => t.propertyType === 'calculation')).toBe(true);
      });

      it('should include calculation property for methods with number return type', () => {
        // Requirement 4.4: Generate calculation properties for numeric return types
        const numericMethod: ServiceMethod = {
          name: 'getTotal',
          parameters: [],
          returnType: 'Promise<number>',
          isAsync: true,
        };

        const propertyTests = generateAllPropertyTests(numericMethod);

        expect(propertyTests.some((t) => t.propertyType === 'calculation')).toBe(true);
      });

      it('should use default configuration when not provided', () => {
        // Requirement 4.2: Use default configuration
        const propertyTests = generateAllPropertyTests(testMethod);

        expect(propertyTests.length).toBeGreaterThan(0);
        propertyTests.forEach((test) => {
          expect(test.code).toContain(`numRuns: ${DEFAULT_PROPERTY_CONFIG.numRuns}`);
          expect(test.code).toContain(`maxSize: ${DEFAULT_PROPERTY_CONFIG.maxSize}`);
        });
      });
    });

    describe('generatePropertyTestImports', () => {
      it('should include fast-check import', () => {
        // Requirement 4.1: Use fast-check library for input generation
        const imports = generatePropertyTestImports(serviceDefinition);

        expect(imports).toContain("import * as fc from 'fast-check'");
      });

      it('should include Vitest imports', () => {
        // Include necessary test framework imports
        const imports = generatePropertyTestImports(serviceDefinition);

        expect(imports).toContain("import { describe, it, expect, beforeEach, vi } from 'vitest'");
      });

      it('should include service import', () => {
        // Include service being tested
        const imports = generatePropertyTestImports(serviceDefinition);

        expect(imports).toContain("import * as testService from './testService'");
      });

      it('should include Supabase mock imports when needed', () => {
        // Include mock utilities for services with Supabase dependency
        const imports = generatePropertyTestImports(serviceDefinition);

        expect(imports).toContain('createMocks');
        expect(imports).toContain('configureMockSuccess');
      });
    });

    describe('formatPropertyTestFile', () => {
      it('should format property test file with proper structure', () => {
        // Requirement 4.6: Generate complete property test file
        const propertyTests = generateAllPropertyTests(testMethod);
        const formatted = formatPropertyTestFile(serviceDefinition, propertyTests);

        expect(formatted).toContain('Property-based tests for testService');
        expect(formatted).toContain("describe('testService - Property Tests'");
        expect(formatted).toContain('import * as fc from');
      });

      it('should include configuration in file header', () => {
        // Requirement 4.2: Document property test configuration
        const propertyTests = generateAllPropertyTests(testMethod);
        const formatted = formatPropertyTestFile(serviceDefinition, propertyTests);

        expect(formatted).toContain('100 runs');
        expect(formatted).toContain('max size 50');
      });

      it('should group property tests by method', () => {
        // Group tests by method for better organization
        const method1: ServiceMethod = {
          name: 'method1',
          parameters: [],
          returnType: 'Promise<void>',
          isAsync: true,
        };

        const method2: ServiceMethod = {
          name: 'method2',
          parameters: [],
          returnType: 'Promise<void>',
          isAsync: true,
        };

        const tests1 = generateAllPropertyTests(method1);
        const tests2 = generateAllPropertyTests(method2);
        const allTests = [...tests1, ...tests2];

        const formatted = formatPropertyTestFile(serviceDefinition, allTests);

        expect(formatted).toContain("describe('method1'");
        expect(formatted).toContain("describe('method2'");
      });

      it('should include mock setup for services with Supabase dependency', () => {
        // Include necessary mock setup
        const propertyTests = generateAllPropertyTests(testMethod);
        const formatted = formatPropertyTestFile(serviceDefinition, propertyTests);

        expect(formatted).toContain('let supabaseMock');
        expect(formatted).toContain('beforeEach');
        expect(formatted).toContain('createMocks()');
      });

      it('should include test descriptions as comments', () => {
        // Requirement 4.6: Add descriptive property names
        const propertyTests = generateAllPropertyTests(testMethod);
        const formatted = formatPropertyTestFile(serviceDefinition, propertyTests);

        propertyTests.forEach((test) => {
          expect(formatted).toContain(`// ${test.description}`);
        });
      });

      it('should produce valid TypeScript code', () => {
        // Ensure generated code is syntactically valid
        const propertyTests = generateAllPropertyTests(testMethod);
        const formatted = formatPropertyTestFile(serviceDefinition, propertyTests);

        // Basic syntax checks
        expect(formatted).toContain('import');
        expect(formatted).toContain('describe(');
        expect(formatted).toContain('it(');
        expect(formatted).toContain('fc.assert');

        // Check for balanced braces
        const openBraces = (formatted.match(/{/g) || []).length;
        const closeBraces = (formatted.match(/}/g) || []).length;
        expect(openBraces).toBe(closeBraces);

        // Check for balanced parentheses
        const openParens = (formatted.match(/\(/g) || []).length;
        const closeParens = (formatted.match(/\)/g) || []).length;
        expect(openParens).toBe(closeParens);
      });
    });

    describe('DEFAULT_PROPERTY_CONFIG', () => {
      it('should have 100 runs as default', () => {
        // Requirement 4.2: Configure property tests to run 100 iterations
        expect(DEFAULT_PROPERTY_CONFIG.numRuns).toBe(100);
      });

      it('should have max size 50 as default', () => {
        // Requirement 4.2: Configure property tests with max size 50
        expect(DEFAULT_PROPERTY_CONFIG.maxSize).toBe(50);
      });

      it('should have timeout configured', () => {
        // Include timeout configuration
        expect(DEFAULT_PROPERTY_CONFIG.timeout).toBeDefined();
        expect(DEFAULT_PROPERTY_CONFIG.timeout).toBeGreaterThan(0);
      });
    });
  });
});
