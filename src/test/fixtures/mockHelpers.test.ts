/**
 * Tests for Mock Helpers
 * Validates that new mock helper functions work correctly
 */

import { describe, it, expect, vi } from 'vitest';
import {
  createQueryMock,
  createMutationMock,
  createFormMock,
  createRouterMock,
} from './mockHelpers';

describe('Mock Helpers', () => {
  describe('createQueryMock', () => {
    it('should create a successful query mock', () => {
      const data = { id: '123', name: 'Test' };
      const mock = createQueryMock(data);

      expect(mock.data).toEqual(data);
      expect(mock.isLoading).toBe(false);
      expect(mock.isError).toBe(false);
      expect(mock.error).toBeNull();
      expect(mock.isSuccess).toBe(true);
      expect(mock.status).toBe('success');
    });

    it('should create a loading query mock', () => {
      const data = { id: '123', name: 'Test' };
      const mock = createQueryMock(data, true);

      expect(mock.isLoading).toBe(true);
      expect(mock.isFetching).toBe(true);
      expect(mock.status).toBe('loading');
    });

    it('should create an error query mock', () => {
      const data = null;
      const error = new Error('Test error');
      const mock = createQueryMock(data, false, error);

      expect(mock.isError).toBe(true);
      expect(mock.error).toEqual(error);
      expect(mock.status).toBe('error');
    });

    it('should include refetch function', () => {
      const mock = createQueryMock({ id: '123' });
      expect(mock.refetch).toBeDefined();
      expect(typeof mock.refetch).toBe('function');
    });
  });

  describe('createMutationMock', () => {
    it('should create a mutation mock with default mutate function', () => {
      const mock = createMutationMock();

      expect(mock.mutate).toBeDefined();
      expect(mock.mutateAsync).toBeDefined();
      expect(mock.isLoading).toBe(false);
      expect(mock.isError).toBe(false);
      expect(mock.error).toBeNull();
      expect(mock.isSuccess).toBe(false);
      expect(mock.status).toBe('idle');
    });

    it('should create a mutation mock with custom mutate function', () => {
      const customMutate = vi.fn();
      const mock = createMutationMock(customMutate);

      expect(mock.mutate).toBe(customMutate);
    });

    it('should include reset function', () => {
      const mock = createMutationMock();
      expect(mock.reset).toBeDefined();
      expect(typeof mock.reset).toBe('function');
    });
  });

  describe('createFormMock', () => {
    it('should create a form mock with default submit handler', () => {
      const mock = createFormMock();

      expect(mock.handleSubmit).toBeDefined();
      expect(mock.register).toBeDefined();
      expect(mock.formState).toBeDefined();
      expect(mock.formState.errors).toEqual({});
      expect(mock.formState.isSubmitting).toBe(false);
      expect(mock.formState.isValid).toBe(true);
    });

    it('should call onSubmit when form is submitted', () => {
      const onSubmit = vi.fn();
      const mock = createFormMock(onSubmit);

      const callback = vi.fn();
      const submitHandler = mock.handleSubmit(callback);

      const mockEvent = { preventDefault: vi.fn() };
      submitHandler(mockEvent);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(callback).toHaveBeenCalled();
      expect(onSubmit).toHaveBeenCalled();
    });

    it('should include form utility functions', () => {
      const mock = createFormMock();

      expect(mock.watch).toBeDefined();
      expect(mock.setValue).toBeDefined();
      expect(mock.getValues).toBeDefined();
      expect(mock.reset).toBeDefined();
      expect(mock.trigger).toBeDefined();
    });

    it('should return proper register function', () => {
      const mock = createFormMock();
      const registration = mock.register('testField');

      expect(registration).toHaveProperty('name', 'testField');
      expect(registration).toHaveProperty('onChange');
      expect(registration).toHaveProperty('onBlur');
      expect(registration).toHaveProperty('ref');
    });
  });

  describe('createRouterMock', () => {
    it('should create a router mock with default navigate function', () => {
      const mock = createRouterMock();

      expect(mock.navigate).toBeDefined();
      expect(mock.location).toBeDefined();
      expect(mock.params).toEqual({});
    });

    it('should create a router mock with custom navigate function', () => {
      const customNavigate = vi.fn();
      const mock = createRouterMock(customNavigate);

      expect(mock.navigate).toBe(customNavigate);
    });

    it('should include location with default values', () => {
      const mock = createRouterMock();

      expect(mock.location.pathname).toBe('/');
      expect(mock.location.search).toBe('');
      expect(mock.location.hash).toBe('');
      expect(mock.location.state).toBeNull();
      expect(mock.location.key).toBe('default');
    });

    it('should include hook functions', () => {
      const mock = createRouterMock();

      expect(mock.useNavigate).toBeDefined();
      expect(mock.useLocation).toBeDefined();
      expect(mock.useParams).toBeDefined();

      const navigate = mock.useNavigate();
      expect(navigate).toBe(mock.navigate);

      const location = mock.useLocation();
      expect(location.pathname).toBe('/');

      const params = mock.useParams();
      expect(params).toEqual({});
    });
  });
});
