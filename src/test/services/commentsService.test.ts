import { describe, it, expect, beforeEach, vi } from 'vitest';
import { commentsService } from '../../services/commentsService';
import { supabase } from '../../lib/supabase';
import { SystemCommentProtectedError } from '../../types/errors';
import type { Comment, RequestType } from '../../types';

// Mock Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

const TEST_UUID = '123e4567-e89b-12d3-a456-426614174000';
const TEST_REQUEST_TYPE: RequestType = 'swap_request';

const mockComment: Comment = {
  id: TEST_UUID,
  request_id: TEST_UUID,
  request_type: TEST_REQUEST_TYPE,
  user_id: TEST_UUID,
  content: 'Test comment',
  is_system: false,
  created_at: '2024-01-01T00:00:00Z',
};

describe('commentsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getComments', () => {
    it('should fetch comments for a request', async () => {
      const mockData = [mockComment];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: mockData,
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const result = await commentsService.getComments(TEST_UUID, TEST_REQUEST_TYPE);

      expect(result).toEqual(mockData);
      expect(supabase.from).toHaveBeenCalledWith('comments');
    });

    it('should throw error when fetch fails', async () => {
      const mockError = new Error('Database error');

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: null,
                error: mockError,
              }),
            }),
          }),
        }),
      } as any);

      await expect(commentsService.getComments(TEST_UUID, TEST_REQUEST_TYPE)).rejects.toThrow(
        'Database error'
      );
    });
  });

  describe('createComment', () => {
    it('should create a new comment', async () => {
      const newComment = {
        request_id: TEST_UUID,
        request_type: TEST_REQUEST_TYPE,
        user_id: TEST_UUID,
        content: 'New comment',
        is_system: false,
      };

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { ...mockComment, ...newComment },
              error: null,
            }),
          }),
        }),
      } as any);

      const result = await commentsService.createComment(newComment);

      expect(result.content).toBe('New comment');
    });

    it('should throw error when creation fails', async () => {
      const mockError = new Error('Creation failed');

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: mockError,
            }),
          }),
        }),
      } as any);

      await expect(
        commentsService.createComment({
          request_id: TEST_UUID,
          request_type: TEST_REQUEST_TYPE,
          user_id: TEST_UUID,
          content: 'Test',
          is_system: false,
        })
      ).rejects.toThrow('Creation failed');
    });
  });

  describe('createSystemComment', () => {
    it('should create a system comment', async () => {
      const systemComment = { ...mockComment, is_system: true };

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: systemComment,
              error: null,
            }),
          }),
        }),
      } as any);

      const result = await commentsService.createSystemComment(
        TEST_UUID,
        TEST_REQUEST_TYPE,
        'System message',
        TEST_UUID
      );

      expect(result.is_system).toBe(true);
    });

    it('should throw error when creation fails', async () => {
      const mockError = new Error('Creation failed');

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: mockError,
            }),
          }),
        }),
      } as any);

      await expect(
        commentsService.createSystemComment(TEST_UUID, TEST_REQUEST_TYPE, 'Test', TEST_UUID)
      ).rejects.toThrow('Creation failed');
    });
  });

  describe('deleteComment', () => {
    it('should delete a user comment successfully', async () => {
      // Mock fetch comment
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { is_system: false },
              error: null,
            }),
          }),
        }),
      } as any);

      // Mock delete
      vi.mocked(supabase.from).mockReturnValueOnce({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      } as any);

      await expect(commentsService.deleteComment(TEST_UUID)).resolves.toBeUndefined();
    });

    it('should throw SystemCommentProtectedError for system comments', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { is_system: true },
              error: null,
            }),
          }),
        }),
      } as any);

      await expect(commentsService.deleteComment(TEST_UUID)).rejects.toThrow(
        SystemCommentProtectedError
      );
    });

    it('should throw error when fetch fails', async () => {
      const mockError = new Error('Fetch failed');

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: mockError,
            }),
          }),
        }),
      } as any);

      await expect(commentsService.deleteComment(TEST_UUID)).rejects.toThrow('Fetch failed');
    });

    it('should throw error when deletion fails', async () => {
      const mockError = new Error('Deletion failed');

      // Mock fetch comment
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { is_system: false },
              error: null,
            }),
          }),
        }),
      } as any);

      // Mock delete failure
      vi.mocked(supabase.from).mockReturnValueOnce({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: mockError,
          }),
        }),
      } as any);

      await expect(commentsService.deleteComment(TEST_UUID)).rejects.toThrow('Deletion failed');
    });
  });

  describe('updateComment', () => {
    it('should update a user comment successfully', async () => {
      const updatedComment = { ...mockComment, content: 'Updated content' };

      // Mock fetch comment
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { is_system: false },
              error: null,
            }),
          }),
        }),
      } as any);

      // Mock update
      vi.mocked(supabase.from).mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: updatedComment,
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const result = await commentsService.updateComment(TEST_UUID, 'Updated content');

      expect(result.content).toBe('Updated content');
    });

    it('should throw SystemCommentProtectedError for system comments', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { is_system: true },
              error: null,
            }),
          }),
        }),
      } as any);

      await expect(commentsService.updateComment(TEST_UUID, 'New content')).rejects.toThrow(
        SystemCommentProtectedError
      );
    });

    it('should throw error when fetch fails', async () => {
      const mockError = new Error('Fetch failed');

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: mockError,
            }),
          }),
        }),
      } as any);

      await expect(commentsService.updateComment(TEST_UUID, 'New content')).rejects.toThrow(
        'Fetch failed'
      );
    });

    it('should throw error when update fails', async () => {
      const mockError = new Error('Update failed');

      // Mock fetch comment
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { is_system: false },
              error: null,
            }),
          }),
        }),
      } as any);

      // Mock update failure
      vi.mocked(supabase.from).mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: mockError,
              }),
            }),
          }),
        }),
      } as any);

      await expect(commentsService.updateComment(TEST_UUID, 'New content')).rejects.toThrow(
        'Update failed'
      );
    });
  });
});
