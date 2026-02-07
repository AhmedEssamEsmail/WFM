// Comments service

import { supabase } from '../lib/supabase'
import type { Comment, RequestType } from '../types'
import { API_ENDPOINTS } from '../constants'

export const commentsService = {
  /**
   * Get comments for a request
   */
  async getComments(requestId: string, requestType: RequestType): Promise<Comment[]> {
    const { data, error } = await supabase
      .from(API_ENDPOINTS.COMMENTS)
      .select('*, users(id, name, email, role)')
      .eq('request_id', requestId)
      .eq('request_type', requestType)
      .order('created_at', { ascending: true })
    
    if (error) throw error
    return data as Comment[]
  },

  /**
   * Create a new comment
   */
  async createComment(comment: Omit<Comment, 'id' | 'created_at'>): Promise<Comment> {
    const { data, error } = await supabase
      .from(API_ENDPOINTS.COMMENTS)
      .insert(comment)
      .select('*, users(id, name, email, role)')
      .single()
    
    if (error) throw error
    return data as Comment
  },

  /**
   * Create a system comment
   */
  async createSystemComment(requestId: string, requestType: RequestType, content: string, userId: string): Promise<Comment> {
    const { data, error } = await supabase
      .from(API_ENDPOINTS.COMMENTS)
      .insert({
        request_id: requestId,
        request_type: requestType,
        user_id: userId,
        content,
      })
      .select('*, users(id, name, email, role)')
      .single()
    
    if (error) throw error
    return data as Comment
  },

  /**
   * Delete a comment
   */
  async deleteComment(commentId: string): Promise<void> {
    const { error } = await supabase
      .from(API_ENDPOINTS.COMMENTS)
      .delete()
      .eq('id', commentId)
    
    if (error) throw error
  },

  /**
   * Update a comment
   */
  async updateComment(commentId: string, content: string): Promise<Comment> {
    const { data, error } = await supabase
      .from(API_ENDPOINTS.COMMENTS)
      .update({ content })
      .eq('id', commentId)
      .select('*, users(id, name, email, role)')
      .single()
    
    if (error) throw error
    return data as Comment
  },
}
